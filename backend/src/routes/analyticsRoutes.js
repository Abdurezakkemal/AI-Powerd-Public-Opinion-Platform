const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const crossAnalyticsController = require("../controllers/crossAnalyticsController");
const auth = require("../middleware/authMiddleware");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");
const limiters = require("../config/rateLimits");
const validateObjectId = require("../middleware/validateObjectId");

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
  validateObjectId("policyId"),
  analyticsReadLimiter,
  analyticsController.getTimeseries,
);

router.get(
  "/:policyId/correlation",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  analyticsReadLimiter,
  analyticsController.getCorrelation,
);

router.get(
  "/:policyId/demographics",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  analyticsReadLimiter,
  analyticsController.getDemographicBreakdown,
);

router.get(
  "/:policyId",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  analyticsReadLimiter,
  hasAssociatePermission("view_analytics"),
  analyticsController.getAnalytics,
);

router.get(
  "/:policyId/export",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  analyticsReadLimiter,
  hasAssociatePermission("export_data"),
  analyticsController.exportAnalytics,
);

router.get(
  "/:policyId/comments",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  analyticsReadLimiter,
  hasAssociatePermission("moderate_comments"),
  analyticsController.getComments,
);

module.exports = router;
