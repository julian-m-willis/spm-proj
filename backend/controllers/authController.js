const authService = require('../services/authService');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// Forget Password Controller
exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await authService.forgetPassword(email); // Call the forget password service
    return res.status(200).json({ message: 'Password reset link sent to your email', reset_url: result.reset_url });
  } catch (error) {
    return res.status(404).json({ message: error.message }); // Return error for user not found
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const result = await authService.resetPassword(token, newPassword); // Call the reset password service
    return res.status(200).json(result); // Success message: Password reset successfully
  } catch (error) {
    return res.status(400).json({ message: error.message }); // Return error for invalid or expired token
  }
};

// Change Password Controller
// exports.changePassword = async (req, res) => {
//   const { currentPassword, newPassword } = req.body;
//   const staffId = req.user.id; // Assuming staffId is coming from the authenticated token

//   try {
//     const result = await authService.changePassword(staffId, currentPassword, newPassword); // Call the change password service
//     return res.status(200).json(result); // Success message: Password changed successfully
//   } catch (error) {
//     return res.status(400).json({ message: error.message }); // Return error for incorrect current password
//   }
// };
