const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authenticateTokenMiddleware');
const authentorizeRole = require('../middleware/authorizeRoleMiddleware');

router.post('/', authenticateToken, scheduleController.createSchedule);
router.get('/manager/:departmentname', authenticateToken,  authentorizeRole([2, 3]), scheduleController.getScheduleByDepartment);
// Implement other routes similarly

module.exports = router;
