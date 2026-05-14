const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

router.post(
  "/",
  auth(["citizen", "planner", "admin"]),
  limiters.comment,
  commentController.postComment,
);

router.get(
  "/policy/:policyId",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("policyId"),
  commentController.getPolicyComments,
);

router.get(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("id"),
  commentController.getCommentById,
);

router.post(
  "/:commentId/report",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("commentId"),
  limiters.reportComment,
  commentController.reportComment,
);

router.put(
  "/:id",
  auth(["citizen", "planner", "admin"]),
  validateObjectId("id"),
  commentController.editComment,
);

router.put(
  "/:commentId/moderate",
  auth(["planner", "admin"]),
  validateObjectId("commentId"),
  limiters.moderateComment,
  hasAssociatePermission("moderate_comments"),
  commentController.moderateComment,
);

router.post(
  "/:commentId/appeal",
  auth(["citizen"]),
  validateObjectId("commentId"),
  limiters.appealComment,
  commentController.appealComment,
);

router.post(
  "/:commentId/resolve-appeal",
  auth(["planner", "admin"]),
  validateObjectId("commentId"),
  commentController.resolveAppeal,
);

router.get(
  "/:id/history",
  auth(["planner", "admin"]),
  validateObjectId("id"),
  commentController.getCommentHistory,
);

module.exports = router;
