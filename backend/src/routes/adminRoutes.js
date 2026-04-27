const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");

// Planner management
router.get("/planners", auth(["admin"]), adminController.listPlanners);
router.post("/planners", auth(["admin"]), adminController.createPlanner);
router.put("/planners/:id", auth(["admin"]), adminController.updatePlanner);
router.put(
  "/planners/:id/status",
  auth(["admin"]),
  adminController.updatePlannerStatus,
);

// ========== COMMENT MANAGEMENT ==========
router.get(
  "/comments/pending",
  auth(["admin"]),
  adminController.getPendingComments,
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

// ========== CITIZEN MANAGEMENT ==========
router.get("/users/citizens", auth(["admin"]), adminController.listCitizens);
router.put(
  "/users/:id/status",
  auth(["admin"]),
  adminController.updateCitizenStatus,
);

module.exports = router;
