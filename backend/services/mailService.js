const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "test-key", // Fallback to "test-key" if not set
});

exports.sendResetPasswordEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  return mg.messages.create(
    "sandbox4bdbbd09b21542d1a41ef3ab735ddbd1.mailgun.org",
    {
      from: "AllinOne WFH System <mailgun@sandbox4bdbbd09b21542d1a41ef3ab735ddbd1.mailgun.org>",
      //   to: email,
      // hardcoded currently
      to: "julian.maximal@gmail.com",
      subject: "Password Reset",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    color: #333;
                }
                .content {
                    text-align: center;
                }
                .content p {
                    color: #666;
                }
                .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007BFF;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    font-size: 16px;
                    margin-top: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #999;
                    font-size: 12px;
                }
                .footer p {
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>We received a request to reset your password. Click the button below to reset it.</p>
                    <a href="${resetLink}" class="btn">Reset Password</a>
                    <p>If you didn’t request a password reset, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
                    <p><a href="${resetLink}">${resetLink}</a></p>
                    <p>Thank you,<br>Your Company Name</p>
                </div>
            </div>
        </body>
        </html>
      `,
    }
  );
};
