const Feedback = require("../models/Feedback");
const Policy = require("../models/Policy");
const User = require("../models/User");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

/**
 * Submit feedback for a policy
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { policyId, rating, comment } = req.body;

    // Validate required fields
    if (!policyId || !rating) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "policyId and rating are required",
        { required: ["policyId", "rating"] },
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
    if (comment && comment.length > 500) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Comment too long (max 500 characters)",
        null,
        400,
      );
    }

    // Fetch user from DB to ensure verified status
    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn(
        `Feedback submission attempt for non-existent user: ${req.user.id}`,
      );
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }
    if (!user.verified) {
      logger.warn(`Unverified user ${user._id} attempted to submit feedback`);
      return sendError(
        res,
        ErrorCodes.NOT_VERIFIED,
        "Please verify your phone number before submitting feedback",
        null,
        403,
      );
    }

    // Fetch policy and validate
    const policy = await Policy.findOne({ _id: policyId, status: "active" });
    if (!policy) {
      logger.warn(
        `Feedback submission for non-active or missing policy: ${policyId}`,
      );
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found or not active",
        null,
        404,
      );
    }

    const now = new Date();
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);
    if (now < start || now > end) {
      logger.warn(
        `Feedback submission outside voting window for policy ${policyId} by user ${user._id}`,
      );
      return sendError(
        res,
        ErrorCodes.VOTING_CLOSED,
        "Voting is not allowed for this policy at this time. Please check the policy dates.",
        null,
        400,
      );
    }

    // Check for duplicate feedback
    const existing = await Feedback.findOne({
      policyId,
      userId: user._id,
    });
    if (existing) {
      logger.warn(
        `Duplicate feedback attempt for policy ${policyId} by user ${user._id}`,
      );
      return sendError(
        res,
        ErrorCodes.ALREADY_VOTED,
        "You have already voted on this policy. Each user can vote only once.",
        null,
        409,
      );
    }

    // Create feedback
    const feedback = new Feedback({
      policyId,
      userId: user._id,
      channel: "app",
      rating,
      comment: comment || "",
      processed: false,
      retryCount: 0,
    });
    await feedback.save();

    // Audit log
    await createAuditLog({
      userId: user._id,
      userRole: user.role,
      action: "SUBMIT_FEEDBACK",
      targetType: "Feedback",
      targetId: feedback._id,
      details: { policyId, rating, hasComment: !!comment },
      req,
    });

    logger.info(
      `Feedback submitted: user ${user._id} rated policy ${policyId} with ${rating} stars`,
    );

    return sendSuccess(
      res,
      {
        id: feedback._id,
        policyId: feedback.policyId,
        rating: feedback.rating,
      },
      "Feedback recorded successfully. Thank you for your input.",
      201,
    );
  } catch (err) {
    if (err.code === 11000) {
      logger.warn(
        `Duplicate key error for feedback submission: ${err.message}`,
      );
      return sendError(
        res,
        ErrorCodes.ALREADY_VOTED,
        "You have already voted on this policy",
        null,
        409,
      );
    }
    logger.error(
      { error: err.message, stack: err.stack },
      "Feedback submit error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to submit feedback. Please try again later.",
      null,
      500,
    );
  }
};
