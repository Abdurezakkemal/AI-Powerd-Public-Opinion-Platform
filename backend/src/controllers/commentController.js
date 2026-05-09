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
const { createNotification } = require("../services/notificationService");

// ========== POST COMMENT (top‑level or reply) ==========
exports.postComment = async (req, res) => {
  try {
    const { policyId, parentCommentId, text } = req.body;
    if (!policyId || !text) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "policyId and text are required",
        null,
        400,
      );
    }
    if (text.length < 1 || text.length > 2000) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Comment must be 1–2000 characters",
        null,
        400,
      );
    }

    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    if (!["active", "paused"].includes(policy.status)) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Comments only allowed on active/paused policies",
        null,
        403,
      );
    }

    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent || parent.policyId.toString() !== policyId) {
        return sendError(
          res,
          ErrorCodes.NOT_FOUND,
          "Parent comment not found in this policy",
          null,
          404,
        );
      }
    }

    const status = parentCommentId ? "approved" : "processing";

    const comment = new Comment({
      policyId,
      userId: req.user.id,
      parentCommentId: parentCommentId || null,
      text,
      status,
      reportCount: 0,
    });
    await comment.save();

    // Notify parent comment author (if reply)
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId).populate(
        "userId",
        "email",
      );
      if (
        parent &&
        parent.userId &&
        parent.userId._id.toString() !== req.user.id.toString()
      ) {
        await createNotification({
          userId: parent.userId._id,
          type: "COMMENT_REPLY",
          title: "New reply to your comment",
          message: `${req.user.id} replied: ${text.slice(0, 100)}...`,
          data: { policyId, commentId: comment._id },
          severity: "info",
          source: "system",
        });
      }
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "POST_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { policyId, parentCommentId, textPreview: text.slice(0, 100) },
      req,
    });

    logger.info(`User ${req.user.id} posted comment on policy ${policyId}`);
    return sendSuccess(res, { commentId: comment._id }, "Comment posted", 201);
  } catch (err) {
    console.error("Full error in postComment:", err);
    logger.error({ error: err.message }, "Post comment error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to post comment",
      null,
      500,
    );
  }
};

// ========== REPORT COMMENT ==========
exports.reportComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    if (!reason)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Reason required",
        null,
        400,
      );

    const comment = await Comment.findById(commentId);
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    comment.reportCount += 1;
    if (comment.reportCount >= 3) {
      comment.status = "flagged";
    }
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "REPORT_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { reason, newReportCount: comment.reportCount },
      req,
    });

    if (comment.reportCount >= 3) {
      const policy = await Policy.findById(comment.policyId);
      if (policy) {
        await createNotification({
          userId: policy.createdBy,
          type: "COMMENT_FLAGGED",
          title: "Comment flagged for review",
          message: `Comment #${commentId} has been reported ${comment.reportCount} times.`,
          data: { commentId, policyId: comment.policyId },
          severity: "warning",
          source: "system",
        });
      }
    }

    return sendSuccess(res, null, "Comment reported. Moderators will review.");
  } catch (err) {
    logger.error({ error: err.message }, "Report comment error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to report comment",
      null,
      500,
    );
  }
};

// ========== MODERATION ENDPOINTS (for planners/admins) ==========
exports.moderateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { status, sentiment, keywords, text } = req.body;
    const allowedStatuses = ["approved", "flagged", "deleted"];
    if (status && !allowedStatuses.includes(status)) {
      return sendError(res, ErrorCodes.VALIDATION, "Invalid status", null, 400);
    }

    const comment = await Comment.findById(commentId).populate("policyId");
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    const isAdmin = req.user.role === "admin";
    const isOwner =
      comment.policyId.createdBy.toString() === req.user.id.toString();
    if (!isAdmin && !isOwner) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "No permission to moderate this comment",
        null,
        403,
      );
    }

    if (status) comment.status = status;
    if (sentiment) comment.sentiment = sentiment;
    if (keywords) comment.keywords = keywords;
    if (text !== undefined) {
      if (!comment.editedHistory) comment.editedHistory = [];
      comment.editedHistory.push({ text: comment.text, editedAt: new Date() });
      comment.text = text;
      comment.updatedAt = new Date();
    }
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "MODERATE_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { changes: { status, sentiment, keywords, textEdited: !!text } },
      req,
    });

    return sendSuccess(
      res,
      { commentId: comment._id, status: comment.status },
      "Comment moderated",
    );
  } catch (err) {
    logger.error({ error: err.message }, "Moderate comment error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to moderate comment",
      null,
      500,
    );
  }
};

// ========== APPEAL A MODERATION DECISION ==========
exports.appealComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    if (!reason)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Appeal reason required",
        null,
        400,
      );

    const comment = await Comment.findById(commentId).populate("policyId");
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );
    if (comment.userId.toString() !== req.user.id.toString()) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You can only appeal your own comments",
        null,
        403,
      );
    }
    if (comment.status !== "flagged" && comment.status !== "deleted") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Only flagged or deleted comments can be appealed",
        null,
        400,
      );
    }

    comment.appeal = {
      reason,
      status: "pending",
      createdAt: new Date(),
    };
    await comment.save();

    await createNotification({
      userId: comment.policyId.createdBy,
      type: "COMMENT_APPEAL",
      title: "Comment appeal submitted",
      message: `User appeals the moderation of comment #${commentId}: ${reason.slice(0, 100)}`,
      data: { commentId, policyId: comment.policyId },
      severity: "info",
      source: "system",
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "APPEAL_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { reason },
      req,
    });

    return sendSuccess(
      res,
      null,
      "Appeal submitted. The policy maker will review.",
    );
  } catch (err) {
    console.error("Full error in appealComment:", err);
    logger.error({ error: err.message, stack: err.stack }, "Appeal error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to submit appeal",
      null,
      500,
    );
  }
};

// ========== RESOLVE APPEAL (planner only) ==========
exports.resolveAppeal = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { decision, note } = req.body;
    if (!["approve", "reject"].includes(decision)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Decision must be approve or reject",
        null,
        400,
      );
    }

    const comment = await Comment.findById(commentId).populate("policyId");
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );
    if (!comment.appeal || comment.appeal.status !== "pending") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "No pending appeal for this comment",
        null,
        400,
      );
    }

    const isAdmin = req.user.role === "admin";
    const isOwner =
      comment.policyId.createdBy.toString() === req.user.id.toString();
    if (!isAdmin && !isOwner) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "No permission to resolve this appeal",
        null,
        403,
      );
    }

    if (decision === "approve") {
      comment.status = "approved";
      comment.appeal.status = "resolved_approved";
    } else {
      comment.status = "flagged";
      comment.appeal.status = "resolved_rejected";
    }
    comment.appeal.resolvedAt = new Date();
    comment.appeal.resolvedBy = req.user.id;
    comment.appeal.resolutionNote = note || "";
    await comment.save();

    await createNotification({
      userId: comment.userId,
      type: "APPEAL_RESOLVED",
      title: `Your appeal has been ${decision === "approve" ? "approved" : "rejected"}`,
      message: note || `The moderator decided to ${decision} your appeal.`,
      data: { commentId },
      severity: "info",
      source: "system",
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RESOLVE_APPEAL",
      targetType: "Comment",
      targetId: comment._id,
      details: { decision, note },
      req,
    });

    return sendSuccess(
      res,
      null,
      `Appeal ${decision}d. Comment status updated.`,
    );
  } catch (err) {
    logger.error({ error: err.message }, "Resolve appeal error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to resolve appeal",
      null,
      500,
    );
  }
};
