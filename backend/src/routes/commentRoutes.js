const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

// Post a comment (top‑level or reply)
router.post(
  "/",
  auth(["citizen", "planner", "admin"]),
  limiters.comment,
  commentController.postComment,
);

// Get comments for a policy (public, with filters)
router.get(
  "/policy/:policyId",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("policyId"),
  commentController.getPolicyComments,
);

// Get a single comment by ID (respects visibility)
router.get(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("id"),
  commentController.getCommentById,
);

// Get replies of a comment (paginated)
router.get(
  "/:commentId/replies",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("commentId"),
  commentController.getReplies,
);

// Report a comment
router.post(
  "/:commentId/report",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("commentId"),
  limiters.reportComment,
  commentController.reportComment,
);

// Edit a comment (author only)
router.put(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("id"),
  commentController.editComment,
);

// Delete a comment (author or admin)
router.delete(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("id"),
  commentController.deleteComment,
);

// Restore a soft‑deleted comment (author or admin)
router.put(
  "/:id/restore",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("id"),
  commentController.restoreComment,
);

// Moderate a comment (planner/admin with permission)
router.put(
  "/:commentId/moderate",
  auth(["planner", "admin"]),
  validateObjectId("commentId"),
  limiters.moderateComment,
  hasAssociatePermission("moderate_comments"),
  commentController.moderateComment,
);

// Citizen submits an appeal for a hidden comment
router.post(
  "/:commentId/appeal",
  auth(["citizen"]),
  validateObjectId("commentId"),
  limiters.appealComment,
  commentController.appealComment,
);

// // Planner/admin resolves an appeal
// router.post(
//   "/:commentId/resolve-appeal",
//   auth(["planner", "admin"]),
//   validateObjectId("commentId"),
//   commentController.resolveAppeal,
// );

// Get my own reports (citizen)
router.get(
  "/my-reports",
  auth(["citizen", "planner", "admin"]),
  commentController.getMyReports,
);

// Get all reports for a specific comment (moderator)
router.get(
  "/:commentId/reports",
  auth(["planner", "admin"]),
  validateObjectId("commentId"),
  commentController.getCommentReports,
);

// Get full event history (planner/admin only)
router.get(
  "/:id/history",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  commentController.getCommentHistory,
);

router.get(
  "/needs-review",
  auth(["planner", "admin"]),
  limiters.analyticsRead,
  commentController.getCommentsNeedingReview,
);

module.exports = router;
