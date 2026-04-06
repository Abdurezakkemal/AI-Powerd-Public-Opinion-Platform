const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");

// Planner management
router.get("/planners", auth(["admin"]), adminController.listPlanners);
router.post("/planners", auth(["admin"]), adminController.createPlanner);
router.put("/planners/:id", auth(["admin"]), adminController.updatePlanner);

// ========== FEEDBACK MANAGEMENT ==========
router.get(
  "/feedback/pending",
  auth(["admin"]),
  adminController.getPendingFeedback,
);
router.put("/feedback/:id", auth(["admin"]), adminController.updateFeedback);
router.post(
  "/feedback/:id/retry",
  auth(["admin"]),
  adminController.retryFeedback,
);
router.post(
  "/feedback/retry-all",
  auth(["admin"]),
  adminController.retryAllFeedback,
);
// ========== CITIZEN MANAGEMENT ==========
router.get("/users/citizens", auth(["admin"]), adminController.listCitizens);

router.put(
  "/users/:id/status",
  auth(["admin"]),
  adminController.updateCitizenStatus,
);
router.put(
  "/planners/:id/status",
  auth(["admin"]),
  adminController.updatePlannerStatus,
);
module.exports = router;
