const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.post('/', scheduleController.createSchedule);
// Implement other routes similarly

module.exports = router;
