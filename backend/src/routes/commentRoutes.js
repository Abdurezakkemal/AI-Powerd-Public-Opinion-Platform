const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const auth = require("../middleware/authMiddleware");

// Add a comment to an existing vote
router.post("/:voteId", auth(["citizen"]), commentController.addCommentToVote);

module.exports = router;
