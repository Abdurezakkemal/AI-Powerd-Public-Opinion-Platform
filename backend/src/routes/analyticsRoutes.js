const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const crossAnalyticsController = require("../controllers/crossAnalyticsController");
const auth = require("../middleware/authMiddleware");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");

// All analytics endpoints require planner or admin role
// For associate permissions, each endpoint uses its specific permission check

// Cross-policy analytics (must be before /:policyId routes)
router.get(
  "/cross",
  auth(["planner", "admin"]),
  crossAnalyticsController.getCrossAnalytics,
);

// Heatmap (requires policyId query param – handled inside controller)
router.get(
  "/heatmap",
  auth(["planner", "admin"]),
  analyticsController.getHeatmap,
);

// Timeseries
router.get(
  "/:policyId/timeseries",
  auth(["planner", "admin"]),
  analyticsController.getTimeseries,
);

// Correlation (only for multipleChoice policies)
router.get(
  "/:policyId/correlation",
  auth(["planner", "admin"]),
  analyticsController.getCorrelation,
);

// Demographic breakdown
router.get(
  "/:policyId/demographics",
  auth(["planner", "admin"]),
  analyticsController.getDemographicBreakdown,
);

// Policy summary analytics (with associate permission)
router.get(
  "/:policyId",
  auth(["planner", "admin"]),
  hasAssociatePermission("view_analytics"),
  analyticsController.getAnalytics,
);

// CSV export (with associate permission)
router.get(
  "/:policyId/export",
  auth(["planner", "admin"]),
  hasAssociatePermission("export_data"),
  analyticsController.exportAnalytics,
);

// Comments list (with associate permission for moderation)
router.get(
  "/:policyId/comments",
  auth(["planner", "admin"]),
  hasAssociatePermission("moderate_comments"),
  analyticsController.getComments,
);

module.exports = router;
