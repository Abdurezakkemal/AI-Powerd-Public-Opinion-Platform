const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policyController");
const auth = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");
const limiters = require("../config/rateLimits");
const validateObjectId = require("../middleware/validateObjectId");

router.get("/", auth(["citizen", "planner", "admin"]), policyController.getAll);
router.get(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("id"),
  policyController.getOne,
);
router.post(
  "/",
  auth(["planner", "admin"]),
  limiters.policyWrite,
  policyController.create,
);
router.put(
  "/:id",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.update,
);
router.delete(
  "/:id",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.delete,
);
router.post(
  "/:id/close",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.close,
);
router.post(
  "/suggest-topics",
  auth(["planner", "admin"]),
  limiters.policyWrite,
  aiController.suggestPolicyTopics,
);

router.patch(
  "/:id/publish",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.publish,
);
router.patch(
  "/:id/unpublish",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.unpublish,
);
router.patch(
  "/:id/extend",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.extendEndDate,
);
router.patch(
  "/:id/pause",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.pause,
);
router.patch(
  "/:id/resume",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.resume,
);

router.post(
  "/:id/clone",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.clone,
);
router.get(
  "/:id/history",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  policyController.getHistory,
);
router.patch(
  "/:id/archive",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.archive,
);
router.patch(
  "/:id/restore",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  limiters.policyWrite,
  policyController.restore,
);

module.exports = router;
