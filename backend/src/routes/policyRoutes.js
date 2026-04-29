const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth(["citizen", "planner", "admin"]), policyController.getAll);
router.get(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  policyController.getOne,
);
router.post("/", auth(["planner", "admin"]), policyController.create);
router.put("/:id", auth(["planner", "admin"]), policyController.update);
router.delete("/:id", auth(["planner", "admin"]), policyController.delete);
router.post("/:id/close", auth(["planner", "admin"]), policyController.close);

// Lifecycle endpoints
router.patch(
  "/:id/activate",
  auth(["planner", "admin"]),
  policyController.activate,
);
router.patch(
  "/:id/extend",
  auth(["planner", "admin"]),
  policyController.extendEndDate,
);
router.patch("/:id/pause", auth(["planner", "admin"]), policyController.pause);
router.patch(
  "/:id/resume",
  auth(["planner", "admin"]),
  policyController.resume,
);

// NEW: Clone a policy
router.post("/:id/clone", auth(["planner", "admin"]), policyController.clone);

// NEW: Policy status history
router.get(
  "/:id/history",
  auth(["planner", "admin"]),
  policyController.getHistory,
);

module.exports = router;
