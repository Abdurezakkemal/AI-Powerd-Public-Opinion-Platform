const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const crossAnalyticsController = require("../controllers/crossAnalyticsController");
const auth = require("../middleware/authMiddleware");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");
const limiters = require("../config/rateLimits");

// All analytics endpoints require planner or admin role and share a read rate limiter
const analyticsReadLimiter = limiters.analyticsRead;

router.get(
  "/cross",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  crossAnalyticsController.getCrossAnalytics,
);

router.get(
  "/heatmap",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  analyticsController.getHeatmap,
);

router.get(
  "/:policyId/timeseries",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  analyticsController.getTimeseries,
);

router.get(
  "/:policyId/correlation",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  analyticsController.getCorrelation,
);

router.get(
  "/:policyId/demographics",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  analyticsController.getDemographicBreakdown,
);

router.get(
  "/:policyId",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  hasAssociatePermission("view_analytics"),
  analyticsController.getAnalytics,
);

router.get(
  "/:policyId/export",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  hasAssociatePermission("export_data"),
  analyticsController.exportAnalytics,
);

router.get(
  "/:policyId/comments",
  auth(["planner", "admin"]),
  analyticsReadLimiter,
  hasAssociatePermission("moderate_comments"),
  analyticsController.getComments,
);

module.exports = router;
