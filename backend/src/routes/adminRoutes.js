const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const reportController = require("../controllers/reportController");
const limiters = require("../config/rateLimits");
const validateObjectId = require("../middleware/validateObjectId");

// Planner management
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

// Comment moderation – AI low confidence
router.get(
  "/comments/pending",
  auth(["admin"]),
  adminController.getPendingComments,
);
// Comment moderation – reported comments
router.get(
  "/comments/flagged",
  auth(["admin"]),
  adminController.getFlaggedComments,
);
// Manual override (sentiment/keywords)
router.put(
  "/comments/:id",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.updateComment,
);
// Retry (single)
router.post(
  "/comments/:id/retry",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.retryComment,
);
// Force retry (any comment)
router.post(
  "/comments/:id/force-retry",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.forceRetryComment,
);
// Bulk retry by IDs
router.post(
  "/comments/bulk/retry-by-ids",
  auth(["admin"]),
  limiters.bulkAdmin,
  adminController.bulkRetryCommentsByIds,
);
// Soft delete comment
router.delete(
  "/comments/:id",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.deleteComment,
);

// Report management
router.get(
  "/comments/:commentId/reports",
  auth(["admin"]),
  validateObjectId("commentId"),
  adminController.getCommentReports,
);
router.put(
  "/comments/:commentId/reports/:reportId",
  auth(["admin"]),
  validateObjectId("commentId"),
  adminController.resolveReport,
);

// Appeal management
router.get("/appeals", auth(["admin"]), adminController.getAppeals);
router.post(
  "/appeals/:commentId/resolve",
  auth(["admin"]),
  validateObjectId("commentId"),
  adminController.resolveAppeal,
);

// Citizen management
router.get("/users/citizens", auth(["admin"]), adminController.listCitizens);
router.put(
  "/users/:id/status",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.updateCitizenStatus,
);

// Dashboard & reports
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

// Admin‑initiated password reset
router.post(
  "/users/:id/initiate-password-reset",
  auth(["admin"]),
  validateObjectId("id"),
  adminController.initiatePasswordReset,
);

module.exports = router;
