const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const reportController = require("../controllers/reportController");
const limiters = require("../config/rateLimits");

// Planner management
router.get("/planners", auth(["admin"]), adminController.listPlanners);
router.post("/planners", auth(["admin"]), adminController.createPlanner);
router.put("/planners/:id", auth(["admin"]), adminController.updatePlanner);
router.put(
  "/planners/:id/status",
  auth(["admin"]),
  adminController.updatePlannerStatus,
);

// Comment management
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
router.put("/comments/:id", auth(["admin"]), adminController.updateComment);
router.post(
  "/comments/:id/retry",
  auth(["admin"]),
  adminController.retryComment,
);
router.post(
  "/comments/retry-all",
  auth(["admin"]),
  adminController.retryAllComments,
);
router.delete("/comments/:id", auth(["admin"]), adminController.deleteComment); // ← ADD THIS

// Citizen management
router.get("/users/citizens", auth(["admin"]), adminController.listCitizens);
router.put(
  "/users/:id/status",
  auth(["admin"]),
  adminController.updateCitizenStatus,
);

// Dashboard & reports (MUST be before module.exports)
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
// Citizen management (already there)
router.get("/users/citizens", auth(["admin"]), adminController.listCitizens);
router.put(
  "/users/:id/status",
  auth(["admin"]),
  adminController.updateCitizenStatus,
);

// ADD THIS:
router.post(
  "/users/:id/initiate-password-reset",
  auth(["admin"]),
  adminController.initiatePasswordReset,
);

// Dashboard & reports
router.get(
  "/dashboard/stats",
  auth(["admin"]),
  reportController.getDashboardStats,
);
module.exports = router;
