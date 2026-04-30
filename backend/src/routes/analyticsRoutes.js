const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/authMiddleware");
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

module.exports = router;
