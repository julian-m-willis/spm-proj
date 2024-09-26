const request = require("supertest");
const express = require("express");
const authController = require("../../controllers/authController");
const authService = require("../../services/authService");

const app = express();
app.use(express.json());
app.post("/login", authController.login);

jest.mock("../../services/authService");

describe("authController.login", () => {
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
