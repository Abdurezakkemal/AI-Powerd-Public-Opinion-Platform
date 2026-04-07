const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/authMiddleware");

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
router.get(
  "/:policyId/geographic",
  auth(["planner", "admin"]),
  analyticsController.getGeographicAnalytics,
);
router.get(
  "/:policyId/trends",
  auth(["planner", "admin"]),
  analyticsController.getTrends,
);

module.exports = router;
