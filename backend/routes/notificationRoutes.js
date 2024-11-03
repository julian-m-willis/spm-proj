const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authenticateToken = require("../middleware/authenticateTokenMiddleware");

router.get(
  "/",
  authenticateToken,
  notificationController.getNotificationsByStaff
);
router.post(
  "/mark-read/:notification_id",
  authenticateToken,
  notificationController.markNotificationAsRead
);
router.post(
  "/mark-all-read/",
  authenticateToken,
  notificationController.markAllNotificationAsRead
);

module.exports = router;
