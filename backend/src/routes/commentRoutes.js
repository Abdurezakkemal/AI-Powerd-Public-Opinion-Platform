const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/authMiddleware");
const limiters = require("../config/rateLimits");
const {
  hasAssociatePermission,
} = require("../middleware/permissionMiddleware");
// Post comment (already rate‑limited)
router.post(
  "/",
  auth(["citizen", "planner", "admin"]),
  limiters.comment,
  commentController.postComment,
);

// Report comment (new rate limiter)
router.post(
  "/:commentId/report",
  auth(["citizen", "planner", "admin"]),
  limiters.reportComment,
  commentController.reportComment,
);

// Moderate comment (rate limiter optional)
router.put(
  "/:commentId/moderate",
  auth(["planner", "admin"]),
  limiters.moderateComment,
  commentController.moderateComment,
);

// Appeal comment (rate limiter)
router.post(
  "/:commentId/appeal",
  auth(["citizen"]),
  limiters.appealComment,
  commentController.appealComment,
);

// Resolve appeal (no extra limiter – uses global)
router.post(
  "/:commentId/resolve-appeal",
  auth(["planner", "admin"]),
  commentController.resolveAppeal,
);

router.put(
  "/:commentId/moderate",
  auth(["planner", "admin"]),
  hasAssociatePermission("moderate_comments"),
  commentController.moderateComment,
);
module.exports = router;
