const authService = require("../../services/authService");
const { Staff } = require("../../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require('sequelize');
const mailService = require("../../services/mailService");

jest.mock("../../models");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("crypto");
jest.mock("../../services/mailService");

describe("authService.login", () => {
  const mockEmail = "test@example.com";
  const mockPassword = "password123";
  const mockStaff = {
    staff_id: 1,
    role_id: 2,
    staff_fname: "John",
    staff_lname: "Doe",
    dept: "Engineering",
    position: "Developer",
    hashed_password: "hashed_password",
  };
  const mockToken = "mockToken";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a token and user details if credentials are valid", async () => {
    Staff.findOne.mockResolvedValue(mockStaff);
    bcrypt.compareSync.mockReturnValue(true);
    jwt.sign.mockReturnValue(mockToken);

    const result = await authService.login(mockEmail, mockPassword);

    expect(Staff.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } });
    expect(bcrypt.compareSync).toHaveBeenCalledWith(
      mockPassword,
      mockStaff.hashed_password
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { staff_id: mockStaff.staff_id, role: mockStaff.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "720h" }
    );
    expect(result).toEqual({
      token: mockToken,
      user: {
        id: mockStaff.staff_id,
        role: mockStaff.role_id,
        name: `${mockStaff.staff_fname} ${mockStaff.staff_lname}`,
        dept: mockStaff.dept,
        position: mockStaff.position,
      },
    });
  });

  it("should throw an error if staff is not found", async () => {
    Staff.findOne.mockResolvedValue(null);

    await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
      "Invalid credentials"
    );
    expect(Staff.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } });
    expect(bcrypt.compareSync).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("should throw an error if password is incorrect", async () => {
    Staff.findOne.mockResolvedValue(mockStaff);
    bcrypt.compareSync.mockReturnValue(false);

    await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
      "Invalid credentials"
    );
    expect(Staff.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } });
    expect(bcrypt.compareSync).toHaveBeenCalledWith(
      mockPassword,
      mockStaff.hashed_password
    );
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});

describe("authService.forgetPassword", () => {
  const mockEmail = "test@example.com";
  const mockStaff = {
    staff_id: 1,
    email: mockEmail,
    resetToken: null,
    resetTokenExpiry: null,
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate a reset token and send a password reset email", async () => {
    Staff.findOne.mockResolvedValue(mockStaff);

    // Mock crypto.randomBytes to return a buffer that converts to a known string
    crypto.randomBytes = jest.fn(() => Buffer.from("mockResetToken"));

    // Mocking the mail service call
    mailService.sendResetPasswordEmail.mockResolvedValue();

    const result = await authService.forgetPassword(mockEmail);

    expect(Staff.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } });

    // We expect any string for the token and URL
    expect(result).toEqual({
      email: mockEmail,
      token: expect.any(String),
      reset_url: expect.stringContaining("/auth/reset-password?token="),
    });

    // Ensure that the save method was called on the user and the email was sent
    expect(mockStaff.save).toHaveBeenCalled();
    expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
      mockEmail,
      expect.any(String)
    );
  });

  it("should throw an error if staff is not found", async () => {
    Staff.findOne.mockResolvedValue(null);

    await expect(authService.forgetPassword(mockEmail)).rejects.toThrow(
      "User not found"
    );
    expect(Staff.findOne).toHaveBeenCalledWith({ where: { email: mockEmail } });
    expect(crypto.randomBytes).not.toHaveBeenCalled();
    expect(mailService.sendResetPasswordEmail).not.toHaveBeenCalled();
  });
});

describe("authService.resetPassword", () => {
  const mockToken = "mockResetToken";
  const mockNewPassword = "newPassword123";
  const mockStaff = {
    staff_id: 1,
    resetToken: mockToken,
    resetTokenExpiry: Date.now() + 3600000, // Valid for 1 hour
    hashed_password: null,
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset the password if the token is valid", async () => {
    Staff.findOne.mockResolvedValue(mockStaff);
    bcrypt.hashSync.mockReturnValue("hashedNewPassword");

    const result = await authService.resetPassword(mockToken, mockNewPassword);

    expect(Staff.findOne).toHaveBeenCalledWith({
      where: {
        resetToken: mockToken,
        resetTokenExpiry: { [Op.gt]: expect.any(Number) }, // Date now check
      },
    });
    expect(bcrypt.hashSync).toHaveBeenCalledWith(mockNewPassword, 10);
    expect(mockStaff.save).toHaveBeenCalled();
    expect(result).toEqual({ message: "Password has been reset successfully" });
  });

  it("should throw an error if the token is invalid or expired", async () => {
    Staff.findOne.mockResolvedValue(null);

    await expect(
      authService.resetPassword(mockToken, mockNewPassword)
    ).rejects.toThrow("Token is invalid or has expired");
    expect(Staff.findOne).toHaveBeenCalled();
    expect(bcrypt.hashSync).not.toHaveBeenCalled();
    expect(mockStaff.save).not.toHaveBeenCalled();
  });
});

describe("authService.changePassword", () => {
  const mockStaffId = 1;
  const mockCurrentPassword = "currentPassword123";
  const mockNewPassword = "newPassword123";
  const mockStaff = {
    staff_id: mockStaffId,
    hashed_password: "hashedNewPassword",
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should change the password if the current password is correct", async () => {
    Staff.findByPk.mockResolvedValue(mockStaff);
    bcrypt.compareSync.mockReturnValue(true);
    bcrypt.hashSync.mockReturnValue("hashedNewPassword");

    const result = await authService.changePassword(
      mockStaffId,
      mockCurrentPassword,
      mockNewPassword
    );

    expect(Staff.findByPk).toHaveBeenCalledWith(mockStaffId);
    expect(bcrypt.compareSync).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockStaff.hashed_password
    );
    expect(bcrypt.hashSync).toHaveBeenCalledWith(mockNewPassword, 10);
    expect(mockStaff.save).toHaveBeenCalled();
    expect(result).toEqual({ message: "Password changed successfully" });
  });

  it("should throw an error if the current password is incorrect", async () => {
    Staff.findByPk.mockResolvedValue(mockStaff);
    bcrypt.compareSync.mockReturnValue(false);

    await expect(
      authService.changePassword(mockStaffId, mockCurrentPassword, mockNewPassword)
    ).rejects.toThrow("Current password is incorrect");

    expect(Staff.findByPk).toHaveBeenCalledWith(mockStaffId);
    expect(bcrypt.compareSync).toHaveBeenCalledWith(
      mockCurrentPassword,
      mockStaff.hashed_password
    );
    expect(bcrypt.hashSync).not.toHaveBeenCalled();
    expect(mockStaff.save).not.toHaveBeenCalled();
  });
});
