const formData = require("form-data");
const Mailgun = require("mailgun.js");

// Mock the Mailgun client
jest.mock("mailgun.js", () => {
  return jest.fn().mockImplementation(() => {
    return {
      client: jest.fn(() => {
        return {
          messages: {
            create: jest.fn(),
          },
        };
      }),
    };
  });
});

const mailService = require("../../services/mailService");

describe("sendResetPasswordEmail", () => {
  let mg;
  let email;
  let token;
  let mockCreate;

  beforeAll(() => {
    // Set up mock data
    email = "test@example.com";
    token = "test-token";
    mg = new Mailgun(formData).client({ key: process.env.MAILGUN_API_KEY });
    mockCreate = mg.messages.create;

    // Ensure environment variables are set
    process.env.FRONTEND_URL = "http://localhost:3000";
    process.env.MAILGUN_API_KEY = "test-key";
  });

  it("should send a reset password email with correct parameters", async () => {
    // Arrange
    const expectedResetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const expectedEmailParams = {
      from: "AllinOne WFH System <mailgun@sandbox4bdbbd09b21542d1a41ef3ab735ddbd1.mailgun.org>",
      to: "julian.maximal@gmail.com", // hardcoded email for testing
      subject: "Password Reset",
      html: expect.stringContaining(expectedResetLink),
    };

    // Act
    await mailService.sendResetPasswordEmail(email, token);
  });
});
