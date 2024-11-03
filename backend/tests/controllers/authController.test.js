const request = require("supertest");
const express = require("express");
const authController = require("../../controllers/authController");
const authService = require("../../services/authService");

const app = express();
app.use(express.json());
app.post("/login", authController.login);
app.post("/forget-password", authController.forgetPassword);
app.post("/reset-password", authController.resetPassword);
app.post("/change-password", authController.changePassword);

jest.mock("../../services/authService");

describe("authController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { staff_id: "test-staff-id" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });
  
  describe("login", () => {
    it("should return a token when login is successful", async () => {
      const mockToken = "mockToken";
      authService.login.mockResolvedValue(mockToken);

      const response = await request(app)
        .post("/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: mockToken });
    });

    it("should return 401 when login fails", async () => {
      const mockError = new Error("Invalid credentials");
      authService.login.mockRejectedValue(mockError);

      const response = await request(app)
        .post("/login")
        .send({ email: "test@example.com", password: "wrongpassword" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: mockError.message });
    });
  });

  describe("forgetPassword", () => {
    it("should return 200 when the forget password request is successful", async () => {
      const mockResetUrl = { reset_url: "http://example.com/reset" };
      authService.forgetPassword.mockResolvedValue(mockResetUrl);

      const response = await request(app)
        .post("/forget-password")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Password reset link sent to your email",
        reset_url: mockResetUrl.reset_url,
      });
    });

    it("should return 404 when the email is not found", async () => {
      const mockError = new Error("User not found");
      authService.forgetPassword.mockRejectedValue(mockError);

      const response = await request(app)
        .post("/forget-password")
        .send({ email: "nonexistent@example.com" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: mockError.message });
    });
  });

  describe("resetPassword", () => {
    it("should return 200 when the password is reset successfully", async () => {
      const mockResponse = { message: "Password reset successfully" };
      authService.resetPassword.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/reset-password")
        .send({ token: "validToken", newPassword: "newpassword123" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it("should return 400 when the reset token is invalid or expired", async () => {
      const mockError = new Error("Invalid or expired token");
      authService.resetPassword.mockRejectedValue(mockError);

      const response = await request(app)
        .post("/reset-password")
        .send({ token: "invalidToken", newPassword: "newpassword123" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: mockError.message });
    });
  });

  describe("changePassword", () => {
    it("should return 200 status when password is changed successfully", async () => {
      const mockResponse = { message: "Password changed successfully" };
      authService.changePassword.mockResolvedValue(mockResponse);

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it("should return 400 status when current password is incorrect", async () => {
      const mockError = new Error("Incorrect current password");
      authService.changePassword.mockRejectedValue(mockError);

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: mockError.message });
    });
  });
});