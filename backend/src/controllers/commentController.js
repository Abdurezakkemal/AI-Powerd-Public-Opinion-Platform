const Comment = require("../models/Comment");
const Vote = require("..//models/Vote");
const Policy = require("../models/Policy");
const User = require("../models/User");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

// Add a comment to an existing vote (no rating needed)
exports.addCommentToVote = async (req, res) => {
  try {
    const { voteId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Comment text is required",
        null,
        400,
      );
    }
    if (comment.length > 500) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Comment too long (max 500 characters)",
        null,
        400,
      );
    }

    // Find the vote and check ownership
    const vote = await Vote.findById(voteId).populate("policyId");
    if (!vote) {
      return sendError(res, ErrorCodes.NOT_FOUND, "Vote not found", null, 404);
    }

    // --- DEBUG LOGS ---
    console.log("\n=== DEBUG OWNERSHIP ===");
    console.log("vote.userId:", vote.userId);
    console.log("typeof vote.userId:", typeof vote.userId);
    console.log(
      "vote.userId as string:",
      vote.userId ? vote.userId.toString() : "null",
    );
    console.log("req.user.id:", req.user.id);
    console.log("typeof req.user.id:", typeof req.user.id);
    console.log("req.user.id as string:", req.user.id.toString());
    console.log(
      "Comparison (using .toString()):",
      vote.userId && vote.userId.toString() === req.user.id.toString(),
    );
    console.log("========================\n");

    // Convert both to strings for reliable comparison
    const voteUserId = vote.userId?.toString();
    const currentUserId = req.user.id?.toString();
    if (!voteUserId || voteUserId !== currentUserId) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You can only comment on your own votes",
        null,
        403,
      );
    }
    // Check if a comment already exists for this vote
    const existingComment = await Comment.findOne({ voteId });
    if (existingComment) {
      return sendError(
        res,
        ErrorCodes.ALREADY_VOTED,
        "You have already commented on this vote",
        null,
        409,
      );
    }

    // Verify the policy is still active (optional)
    const policy = vote.policyId;
    if (policy.status !== "active") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Cannot comment on a policy that is not active",
        null,
        403,
      );
    }
    const now = new Date();
    if (now < policy.startDate || now > policy.endDate) {
      return sendError(
        res,
        ErrorCodes.VOTING_CLOSED,
        "Voting period is closed, cannot add comment",
        null,
        400,
      );
    }

    // Create the comment linked to the vote
    const commentDoc = new Comment({
      voteId: vote._id,
      policyId: vote.policyId,
      userId: req.user.id,
      rating: vote.rating,
      comment: comment.trim(),
      processed: false,
      status: "processing",
    });
    await commentDoc.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "ADD_COMMENT",
      targetType: "Comment",
      targetId: commentDoc._id,
      details: {
        voteId,
        policyId: vote.policyId,
        commentLength: comment.length,
      },
      req,
    });

    logger.info(`User ${req.user.id} added comment to vote ${voteId}`);
    return sendSuccess(
      res,
      { commentId: commentDoc._id },
      "Comment added successfully. AI will process it.",
      201,
    );
  } catch (err) {
    if (err.code === 11000) {
      return sendError(
        res,
        ErrorCodes.ALREADY_VOTED,
        "A comment already exists for this vote",
        null,
        409,
      );
    }
    logger.error({ error: err.message, stack: err.stack }, "Add comment error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to add comment",
      null,
      500,
    );
  }
};
