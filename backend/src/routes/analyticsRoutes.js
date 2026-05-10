const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/authMiddleware");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");

// Existing (keep)
router.get(
  "/heatmap",
  auth(["planner", "admin"]),
  analyticsController.getHeatmap,
);
router.get(
  "/:policyId",
  auth(["planner", "admin"]),
  analyticsController.getAnalytics,
);
router.get(
  "/:policyId/export",
  auth(["planner", "admin"]),
  analyticsController.exportAnalytics,
);
router.get(
  "/:policyId/comments",
  auth(["planner", "admin"]),
  analyticsController.getComments,
);

// New
router.get(
  "/:policyId/timeseries",
  auth(["planner", "admin"]),
  analyticsController.getTimeseries,
);
router.get(
  "/:policyId/correlation",
  auth(["planner", "admin"]),
  analyticsController.getCorrelation,
);
router.get(
  "/:policyId/demographics",
  auth(["planner", "admin"]),
  analyticsController.getDemographicBreakdown,
);
router.get(
  "/:policyId",
  auth(["planner", "admin"]),
  hasAssociatePermission("view_analytics"),
  analyticsController.getAnalytics,
);
router.get(
  "/:policyId/export",
  auth(["planner", "admin"]),
  hasAssociatePermission("export_data"),
  analyticsController.exportAnalytics,
);
router.get(
  "/:policyId/comments",
  auth(["planner", "admin"]),
  hasAssociatePermission("moderate_comments"),
  analyticsController.getComments,
);

// router.get(
//   "/compare",
//   auth(["planner", "admin"]),
//   analyticsController.comparePolicies,
// );

module.exports = router;
