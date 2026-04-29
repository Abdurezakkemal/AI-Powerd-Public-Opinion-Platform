const Vote = require("../models/Vote");
const Comment = require("../models/Comment");
const Policy = require("../models/Policy");
const User = require("../models/User");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

// Submit vote from app (authenticated user) – optional comment
exports.submitAppVote = async (req, res) => {
  try {
    const { policyId, rating, comment } = req.body;
    if (!policyId || !rating) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "policyId and rating are required",
        null,
        400,
      );
    }
    if (rating < 1 || rating > 5) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Rating must be between 1 and 5",
        null,
        400,
      );
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn(`Vote attempt for non-existent user: ${req.user.id}`);
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }
    if (!user.verified) {
      return sendError(
        res,
        ErrorCodes.NOT_VERIFIED,
        "Please verify your phone number first",
        null,
        403,
      );
    }

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (policy.status === "draft" || policy.status === "published") {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    if (policy.status !== "active") {
      let msg = "Policy not open for voting";
      if (policy.status === "paused") msg = "Voting is temporarily paused";
      else if (policy.status === "closed") msg = "Policy is closed for voting";
      return sendError(res, ErrorCodes.FORBIDDEN, msg, null, 403);
    }

    const now = new Date();
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);
    if (now < start || now > end) {
      return sendError(
        res,
        ErrorCodes.VOTING_CLOSED,
        "Voting not allowed at this time",
        null,
        400,
      );
    }

    // Check existing vote by userId OR phoneHash (SMS pre‑registration)
    const existing = await Vote.findOne({
      policyId,
      $or: [{ userId: user._id }, { phoneHash: user.phoneHash }],
    });
    if (existing) {
      logger.warn(
        `Duplicate vote attempt for policy ${policyId} by user ${user._id}`,
      );
      return sendError(
        res,
        ErrorCodes.ALREADY_VOTED,
        "You have already voted on this policy",
        null,
        409,
      );
    }

    // Create the vote (always has userId and phoneHash)
    const vote = new Vote({
      policyId,
      userId: user._id,
      phoneHash: user.phoneHash,
      channel: "app",
      rating,
    });
    await vote.save();

    let commentDoc = null;
    if (comment && comment.trim().length > 0) {
      if (comment.length > 500) {
        // Clean up vote if comment too long
        await Vote.deleteOne({ _id: vote._id });
        return sendError(
          res,
          ErrorCodes.VALIDATION,
          "Comment too long (max 500 characters)",
          null,
          400,
        );
      }
      commentDoc = new Comment({
        voteId: vote._id,
        policyId,
        userId: user._id,
        rating,
        comment: comment.trim(),
        processed: false,
        status: "processing",
      });
      await commentDoc.save();
    }

    await createAuditLog({
      userId: user._id,
      userRole: user.role,
      action: "SUBMIT_VOTE",
      targetType: "Vote",
      targetId: vote._id,
      details: { policyId, rating, hasComment: !!commentDoc },
      req,
    });

    logger.info(`User ${user._id} voted ${rating} on policy ${policyId}`);
    return sendSuccess(
      res,
      { voteId: vote._id, commentId: commentDoc?._id || null, rating },
      commentDoc
        ? "Vote and comment recorded. AI will process comment."
        : "Vote recorded successfully",
      201,
    );
  } catch (err) {
    if (err.code === 11000) {
      return sendError(
        res,
        ErrorCodes.ALREADY_VOTED,
        "You have already voted on this policy",
        null,
        409,
      );
    }
    logger.error({ error: err.message, stack: err.stack }, "App vote error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to submit vote",
      null,
      500,
    );
  }
};
