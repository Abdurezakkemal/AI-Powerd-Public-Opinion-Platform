const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");
const auth = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");
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
router.post(
  "/suggest-topics",
  auth(["planner", "admin"]),
  aiController.suggestPolicyTopics,
);
// Lifecycle endpoints
router.patch(
  "/:id/publish",
  auth(["planner", "admin"]),
  policyController.publish,
);
router.patch(
  "/:id/unpublish",
  auth(["planner", "admin"]),
  policyController.unpublish,
);
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

// Clone and history
router.post("/:id/clone", auth(["planner", "admin"]), policyController.clone);
router.get(
  "/:id/history",
  auth(["planner", "admin"]),
  policyController.getHistory,
);
router.patch(
  "/:id/archive",
  auth(["planner", "admin"]),
  policyController.archive,
);
router.patch(
  "/:id/restore",
  auth(["planner", "admin"]),
  policyController.restore,
);

module.exports = router;
