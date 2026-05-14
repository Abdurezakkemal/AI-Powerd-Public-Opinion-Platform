const express = require("express");
const router = express.Router();
const plannerController = require("../controllers/plannerController");
const auth = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");
const validateObjectId = require("../middleware/validateObjectId");

router.post(
  "/request",
  auth(["citizen"]),
  limiters.plannerRequest,
  plannerController.requestPlanner,
);
router.post(
  "/training/complete",
  auth(["planner"]),
  plannerController.completeTraining,
);

router.get(
  "/requests/pending",
  auth(["admin"]),
  plannerController.listPendingRequests,
);
router.post(
  "/requests/:id/approve",
  auth(["admin"]),
  validateObjectId("id"),
  plannerController.approveRequest,
);
router.post(
  "/requests/:id/reject",
  auth(["admin"]),
  validateObjectId("id"),
  plannerController.rejectRequest,
);

router.get(
  "/search",
  auth(["planner", "admin"]),
  plannerController.searchPlannersByLanguage,
);

router.post(
  "/policies/:policyId/associates",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  plannerController.addAssociate,
);
router.get(
  "/policies/:policyId/associates",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  plannerController.listAssociates,
);
router.patch(
  "/policies/:policyId/associates/:associateId",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  validateObjectId("associateId"),
  plannerController.updateAssociatePermissions,
);
router.delete(
  "/policies/:policyId/associates/:associateId",
  auth(["planner", "admin"]),
  validateObjectId("policyId"),
  validateObjectId("associateId"),
  plannerController.revokeAssociate,
);

module.exports = router;
