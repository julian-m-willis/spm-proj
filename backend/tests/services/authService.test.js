const authService = require("../../services/authService");
const { Staff } = require("../../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../../models");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

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
