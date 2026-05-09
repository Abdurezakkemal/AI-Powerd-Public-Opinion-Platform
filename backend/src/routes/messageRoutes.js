const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const auth = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");

// All message endpoints require planner or admin role
router.post(
  "/",
  auth(["planner", "admin"]),
  limiters.comment,
  messageController.sendMessage,
);
router.get("/inbox", auth(["planner", "admin"]), messageController.getInbox);
router.get("/:id", auth(["planner", "admin"]), messageController.getMessage);
router.post(
  "/:id/reply",
  auth(["planner", "admin"]),
  limiters.comment,
  messageController.replyToMessage,
);

module.exports = router;
