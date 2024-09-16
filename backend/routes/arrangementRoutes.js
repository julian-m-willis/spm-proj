const express = require('express');
const router = express.Router();
const arrangementController = require('../controllers/arrangementController');
const authenticateToken = require('../middleware/authenticateTokenMiddleware');
const authentorizeRole = require('../middleware/authorizeRoleMiddleware');

router.post('/', authenticateToken, authentorizeRole([1, 2, 3]), arrangementController.createArrangement);
// Apply middleware to other routes as needed

module.exports = router;