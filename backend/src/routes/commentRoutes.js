const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");

// Post comment
router.post(
  "/",
  auth(["citizen", "planner", "admin"]),
  limiters.comment,
  commentController.postComment,
);

// Report comment
router.post(
  "/:commentId/report",
  auth(["citizen", "planner", "admin"]),
  limiters.reportComment,
  commentController.reportComment,
);

// Edit comment – author only
router.put(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  commentController.editComment,
);

// Moderate comment – only with permission
router.put(
  "/:commentId/moderate",
  auth(["planner", "admin"]),
  hasAssociatePermission("moderate_comments"),
  commentController.moderateComment,
);

// Appeal comment – citizen only
router.post(
  "/:commentId/appeal",
  auth(["citizen"]),
  limiters.appealComment,
  commentController.appealComment,
);

// Resolve appeal – planner or admin
router.post(
  "/:commentId/resolve-appeal",
  auth(["planner", "admin"]),
  commentController.resolveAppeal,
);

// View edit history – planners/admins only
router.get(
  "/:id/history",
  auth(["planner", "admin"]),
  commentController.getCommentHistory,
);

module.exports = router;
