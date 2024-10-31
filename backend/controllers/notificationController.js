const notificationService = require('../services/notificationService');

// Controller to get notifications by staff ID
exports.getNotificationsByStaff = async (req, res) => {
  try {
    const staffId = req.user.staff_id
    const notifications = await notificationService.getNotificationsByStaff(staffId);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notification_id;
    await notificationService.markNotificationAsRead(notificationId);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Controller to mark a notification as read
exports.markAllNotificationAsRead = async (req, res) => {
  try {
    const staffId = req.user.staff_id
    await notificationService.markAllNotificationAsRead(staffId);
    res.status(200).json({ message: 'All Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
