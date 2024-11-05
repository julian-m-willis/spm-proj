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
router.post(
  "/batch/",
  authenticateToken,
  authentorizeRole([1, 2, 3]),
  arrangementController.createBatchArrangement
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
  "/manager/approve_partial/:id",
  authenticateToken,
  authorizeRole([1, 3]),
  arrangementController.approvePartialRequest
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

router.get(
  "/staff/",
  authenticateToken,
  authorizeRole([1, 2, 3]),
  arrangementController.getArrangementbyStaff
);
router.post(
  "/staff/withdraw/:id",
  authenticateToken,
  authorizeRole([1, 2, 3]),
  arrangementController.withdrawRequest
);

module.exports = router;
