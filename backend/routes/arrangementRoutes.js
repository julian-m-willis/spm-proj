const express = require("express");
const router = express.Router();
const arrangementController = require("../controllers/arrangementController");
const authenticateToken = require("../middleware/authenticateTokenMiddleware");
const authentorizeRole = require("../middleware/authorizeRoleMiddleware");
const authorizeRole = require("../middleware/authorizeRoleMiddleware");

router.post(
  "/",
  authenticateToken,
  authentorizeRole([1, 2, 3]),
  arrangementController.createArrangement
);
router.get(
  "/",
  authenticateToken,
  authentorizeRole([1, 2, 3]),
  arrangementController.getAllArrangements
);
router.get(
  "/manager/",
  authenticateToken,
  authorizeRole([1, 3]),
  arrangementController.getArrangementbyManager
);

module.exports = router;
