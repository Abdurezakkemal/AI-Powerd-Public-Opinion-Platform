const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const reportController = require("../controllers/reportController");
const limiters = require("../config/rateLimits");
const validateObjectId = require("../middleware/validateObjectId");

router.get("/planners", auth(["admin"]), adminController.listPlanners);
router.post("/planners", auth(["admin"]), adminController.createPlanner);
router.put(
  "/planners/:id",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.updatePlanner,
);
router.put(
  "/planners/:id/status",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.updatePlannerStatus,
);

router.get(
  "/comments/pending",
  auth(["admin"]),
  adminController.getPendingComments,
);
router.get(
  "/comments/flagged",
  auth(["admin"]),
  adminController.getFlaggedComments,
);
router.put(
  "/comments/:id",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.updateComment,
);

router.post(
  "/comments/:id/retry",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.retryComment,
);
router.post(
  "/comments/:id/force-retry",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.forceRetryComment,
);
router.post(
  "/comments/bulk/retry-by-ids",
  auth(["admin"]),
  limiters.bulkAdmin,
  adminController.bulkRetryCommentsByIds,
);
router.delete(
  "/comments/:id",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.deleteComment,
);

router.get("/users/citizens", auth(["admin"]), adminController.listCitizens);
router.put(
  "/users/:id/status",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.updateCitizenStatus,
);

router.get(
  "/dashboard/stats",
  auth(["admin"]),
  reportController.getDashboardStats,
);
router.get("/trends", auth(["admin"]), reportController.getTrends);
router.get("/audit-logs", auth(["admin"]), reportController.getAuditLogs);
router.get(
  "/audit-logs/export",
  auth(["admin"]),
  reportController.exportAuditLogs,
);
router.get("/ai/health", auth(["admin"]), reportController.getAIHealth);

router.post(
  "/users/:id/initiate-password-reset",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.initiatePasswordReset,
);

module.exports = router;
