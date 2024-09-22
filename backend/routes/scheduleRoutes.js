const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authenticateTokenMiddleware');
const authentorizeRole = require('../middleware/authorizeRoleMiddleware');

router.post('/', authenticateToken, scheduleController.createSchedule);
router.get('/manager/:departmentname', authenticateToken,  authentorizeRole([1, 3]), scheduleController.getScheduleByDepartment);
router.get('/hr', authenticateToken,  authentorizeRole([1]), scheduleController.getScheduleByDepartment);
router.get('/staff/team', authenticateToken, scheduleController.getScheduleByTeam);
router.get('/staff', authenticateToken, scheduleController.getSchedulePersonal);

module.exports = router;
