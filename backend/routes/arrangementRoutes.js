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
router.post(
  "/manager/approve/:id",
  authenticateToken,
  authorizeRole([1, 3]),
  arrangementController.approveRequest
);
router.post(
  "/manager/reject/:id",
  authenticateToken,
  authorizeRole([1, 3]),
  arrangementController.rejectRequest
);
router.post(
    "/manager/undo/:id",
    authenticateToken,
    authorizeRole([1, 3]),
    arrangementController.undo
);
router.post(
  "/manager/revoke/:id",
  authenticateToken,
  authorizeRole([1, 3]),
  arrangementController.revokeRequest
);
router.get(
  "/manager/approved/",
  authenticateToken,
  authorizeRole([1, 3]),
  arrangementController.getApprovedRequests
);
module.exports = router;
