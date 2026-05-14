const express = require("express");
const router = express.Router();
const plannerController = require("../controllers/plannerController");
const auth = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");

const optionalCitizenAuth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return next();
  return auth(["citizen"])(req, res, next);
};

// Citizens and non-citizens submit planner requests (rate limited by user or IP)
router.post(
  "/request",
  optionalCitizenAuth,
  limiters.plannerRequest,
  plannerController.requestPlanner,
);

// Planner completes mandatory training
router.post(
  "/training/complete",
  auth(["planner"]),
  plannerController.completeTraining,
);

// Admin endpoints for managing requests
router.get(
  "/requests/pending",
  auth(["admin"]),
  plannerController.listPendingRequests,
);
router.post(
  "/requests/:id/approve",
  auth(["admin"]),
  plannerController.approveRequest,
);
router.post(
  "/requests/:id/reject",
  auth(["admin"]),
  plannerController.rejectRequest,
);

router.get(
  "/search",
  auth(["planner", "admin"]),
  plannerController.searchPlannersByLanguage,
);

// Associates management
router.post(
  "/policies/:policyId/associates",
  auth(["planner", "admin"]),
  plannerController.addAssociate,
);
router.get(
  "/policies/:policyId/associates",
  auth(["planner", "admin"]),
  plannerController.listAssociates,
);
router.patch(
  "/policies/:policyId/associates/:associateId",
  auth(["planner", "admin"]),
  plannerController.updateAssociatePermissions,
);
router.delete(
  "/policies/:policyId/associates/:associateId",
  auth(["planner", "admin"]),
  plannerController.revokeAssociate,
);

module.exports = router;
