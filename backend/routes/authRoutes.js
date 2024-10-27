const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authenticateTokenMiddleware");

router.post("/login", authController.login);
router.post("/forget", authController.forgetPassword);
router.post("/resetpassword", authController.resetPassword);
router.post(
  "/changepassword",
  authenticateToken,
  authController.changePassword
);
module.exports = router;
