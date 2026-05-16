const User = require("../models/User");
const Comment = require("..//models/Comment");
const PlannerRequest = require("../models/PlannerRequest");
const { sendEmail } = require("../utils/email");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { hashPassword } = require("../utils/helpers");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
const client = require("../config/redis");
const { sendAdminInitiatedResetEmail } = require("../utils/email");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");
// ========== PLANNER MANAGEMENT ==========

// GET /admin/planners
exports.listPlanners = async (req, res) => {
  try {
    const { active, page = 1, limit = 10 } = req.query;

    const query = { role: "planner" };
    if (active !== undefined) query.active = active === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [planners, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash -phoneHash")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    logger.info(
      `Admin ${req.user.id} listed planners (page ${page}, total ${total})`,
    );
    return sendSuccess(
      res,
      {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        planners,
      },
      "Planners retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "List planners error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve planners. Please try again later.",
      null,
      500,
    );
  }
};

// POST /admin/planners
exports.createPlanner = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Email and password are required",
        { required: ["email", "password"] },
        400,
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn(
        `Admin ${req.user.id} attempted to create planner with existing email: ${email}`,
      );
      return sendError(
        res,
        ErrorCodes.DUPLICATE,
        "A user with this email already exists",
        null,
        409,
      );
    }

    const passwordHash = await hashPassword(password);
    const uniquePhonePlaceholder = `planner_no_phone_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const planner = new User({
      email,
      passwordHash,
      role: "planner",
      phoneHash: uniquePhonePlaceholder,
      region: "",
      ageRange: "25-34",
      gender: "prefer-not-to-say",
      occupation: "government-employee",
      education: "bachelors",
      languagesSpoken: ["en"],
      verified: true,
      active: true,
      trainingCompletedAt: new Date(),
    });
    await planner.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "CREATE_PLANNER",
      targetType: "User",
      targetId: planner._id,
      details: { email: planner.email },
      req,
    });

    logger.info(
      `Admin ${req.user.id} created planner: ${email} (${planner._id})`,
    );
    return sendSuccess(
      res,
      { id: planner._id, email: planner.email },
      "Planner account created successfully",
      201,
    );
  } catch (err) {
    logger.error(
      {
        error: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
      },
      "Create planner error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to create planner. Please try again.",
      null,
      500,
    );
  }
};

// PUT /admin/planners/:id
exports.updatePlanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, active } = req.body;

    const planner = await User.findOne({ _id: id, role: "planner" });
    if (!planner) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Planner not found",
        null,
        404,
      );
    }

    const changes = {};
    const updates = {};
    if (password) {
      updates.passwordHash = await hashPassword(password);
      changes.password = "updated";
    }
    if (active !== undefined) {
      updates.active = active;
      changes.active = active;
    }
    if (Object.keys(updates).length) {
      await User.updateOne(
        { _id: planner._id },
        { $set: updates },
        { runValidators: false },
      );
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_PLANNER",
      targetType: "User",
      targetId: planner._id,
      details: { email: planner.email, changes },
      req,
    });

    logger.info(
      `Admin ${req.user.id} updated planner: ${planner.email} (${planner._id})`,
    );
    return sendSuccess(
      res,
      {
        id: planner._id,
        email: planner.email,
        active: active ?? planner.active,
      },
      "Planner updated successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Update planner error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update planner. Please try again.",
      null,
      500,
    );
  }
};

// PUT /admin/planners/:id/status
exports.updatePlannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    if (active === undefined) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "active field is required (true/false)",
        null,
        400,
      );
    }

    const planner = await User.findOne({ _id: id, role: "planner" });
    if (!planner) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Planner not found",
        null,
        404,
      );
    }

    await User.updateOne(
      { _id: planner._id },
      { $set: { active } },
      { runValidators: false },
    );

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_PLANNER_STATUS",
      targetType: "User",
      targetId: planner._id,
      details: { email: planner.email, active },
      req,
    });

    const statusText = active ? "activated" : "deactivated";
    logger.info(
      `Admin ${req.user.id} ${statusText} planner: ${planner.email} (${planner._id})`,
    );
    return sendSuccess(
      res,
      { plannerId: planner._id, active },
      `Planner account ${statusText} successfully`,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Update planner status error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update planner status",
      null,
      500,
    );
  }
};

// ========== COMMENT MANAGEMENT ==========

// GET /admin/comments/pending – comments that need AI review
// Includes: low confidence (sentimentReviewNeeded = true) OR pending (retried/edited) that have been analysed before (lastAnalyzedAt != null)
exports.getPendingComments = async (req, res) => {
  try {
    const filter = {
      visibility: "visible",
      $or: [
        { "reviewFlags.sentimentReviewNeeded": true },
        { aiStatus: "pending", lastAnalyzedAt: { $ne: null } },
      ],
    };
    const comments = await Comment.find(filter)
      .populate("policyId", "title")
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });
    logger.info(
      `Admin ${req.user.id} retrieved ${comments.length} pending comments`,
    );
    return sendSuccess(
      res,
      { comments },
      "Pending comments retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get pending comments error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve pending comments",
      null,
      500,
    );
  }
};
// GET /admin/comments/flagged – reported comments (hidden)
exports.getFlaggedComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      reportState: { $in: ["reported", "under_review"] },
      visibility: "hidden",
    })
      .populate("policyId", "title")
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });
    logger.info(
      `Admin ${req.user.id} retrieved ${comments.length} flagged comments`,
    );
    return sendSuccess(
      res,
      { comments },
      "Flagged comments retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get flagged comments error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve flagged comments",
      null,
      500,
    );
  }
};

// PUT /admin/comments/:id – manual override (sentiment & keywords only)
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { sentiment, keywords } = req.body;
    const updateData = {};
    if (sentiment !== undefined) {
      updateData.sentiment = {
        label: sentiment.label,
        confidence: 1,
        overriddenByModerator: true,
      };
    }
    if (keywords !== undefined) updateData.keywords = keywords;
    if (Object.keys(updateData).length === 0) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "No valid fields provided (sentiment or keywords)",
        null,
        400,
      );
    }

    const comment = await Comment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    comment.events.push({
      type: "moderated",
      actor: req.user.id,
      data: { action: "override_sentiment_keywords", updates: updateData },
      createdAt: new Date(),
    });
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { policyId: comment.policyId, updates: updateData },
      req,
    });

    logger.info(`Admin ${req.user.id} updated comment ${id}`);
    return sendSuccess(res, comment, "Comment updated successfully");
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Update comment error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update comment",
      null,
      500,
    );
  }
};

// Normal retry – only for comments that have been AI processed (or failed) and are visible
exports.retryComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    if (comment.aiStatus !== "processed" && comment.aiStatus !== "failed") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only processed or failed comments can be retried. Current: ${comment.aiStatus}`,
        null,
        400,
      );
    }
    if (comment.visibility !== "visible") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Only visible comments can be retried.",
        null,
        400,
      );
    }

    comment.aiStatus = "pending";
    comment.sentiment = {
      label: null,
      confidence: null,
      overriddenByModerator: false,
    };
    comment.keywords = [];
    comment.retryCount = 0;
    comment.nextRetry = null;
    comment.reviewFlags.sentimentReviewNeeded = false;

    comment.events.push({
      type: "ai_analyzed",
      actor: req.user.id,
      data: { action: "manual_retry" },
      createdAt: new Date(),
    });
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RETRY_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { policyId: comment.policyId },
      req,
    });

    logger.info(`Admin ${req.user.id} retried comment ${id}`);
    return sendSuccess(
      res,
      { commentId: id },
      "Comment queued for AI reprocessing.",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Retry comment error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to queue comment for retry",
      null,
      500,
    );
  }
};

// Retry single comment (strict) – only for processed/failed, visible
exports.retryComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    if (comment.aiStatus !== "processed" && comment.aiStatus !== "failed") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only processed or failed comments can be retried. Current: ${comment.aiStatus}`,
        null,
        400,
      );
    }
    if (comment.visibility !== "visible") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Only visible comments can be retried.",
        null,
        400,
      );
    }

    comment.aiStatus = "pending";
    comment.sentiment = {
      label: null,
      confidence: null,
      overriddenByModerator: false,
    };
    comment.keywords = [];
    comment.retryCount = 0;
    comment.nextRetry = null;
    comment.reviewFlags.sentimentReviewNeeded = false;
    // Keep lastAnalyzedAt unchanged (so it will appear in pending queue)

    comment.events.push({
      type: "ai_analyzed",
      actor: req.user.id,
      data: { action: "manual_retry" },
      createdAt: new Date(),
    });
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RETRY_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { policyId: comment.policyId },
      req,
    });

    logger.info(`Admin ${req.user.id} retried comment ${id}`);
    return sendSuccess(
      res,
      { commentId: id },
      "Comment queued for AI reprocessing.",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Retry comment error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to queue comment for retry",
      null,
      500,
    );
  }
};

// Force retry – any comment, no checks
exports.forceRetryComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    comment.aiStatus = "pending";
    comment.sentiment = {
      label: null,
      confidence: null,
      overriddenByModerator: false,
    };
    comment.keywords = [];
    comment.retryCount = 0;
    comment.nextRetry = null;
    comment.reviewFlags.sentimentReviewNeeded = false;
    // Keep lastAnalyzedAt unchanged

    comment.events.push({
      type: "ai_analyzed",
      actor: req.user.id,
      data: { action: "force_retry" },
      createdAt: new Date(),
    });
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "FORCE_RETRY_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { policyId: comment.policyId },
      req,
    });

    logger.info(`Admin ${req.user.id} force‑retried comment ${id}`);
    return sendSuccess(
      res,
      { commentId: id },
      "Comment force‑queued for AI reprocessing.",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Force retry error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to force‑retry comment",
      null,
      500,
    );
  }
};

// Bulk retry by IDs – strict criteria (only processed/failed, visible)
exports.bulkRetryCommentsByIds = async (req, res) => {
  try {
    const { commentIds } = req.body;
    const dryRun = req.query.dryRun === "true";

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "commentIds array is required",
        null,
        400,
      );
    }

    const succeeded = [];
    const failed = [];

    for (const id of commentIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        failed.push({ id, reason: "Invalid ObjectId" });
        continue;
      }

      const comment = await Comment.findOne({
        _id: id,
        aiStatus: { $in: ["processed", "failed"] },
        visibility: "visible",
      });

      if (!comment) {
        failed.push({
          id,
          reason:
            "Comment not found or not eligible (must be processed/failed and visible)",
        });
        continue;
      }

      if (dryRun) {
        succeeded.push(id);
        continue;
      }

      comment.aiStatus = "pending";
      comment.sentiment = {
        label: null,
        confidence: null,
        overriddenByModerator: false,
      };
      comment.keywords = [];
      comment.retryCount = 0;
      comment.nextRetry = null;
      comment.reviewFlags.sentimentReviewNeeded = false;
      comment.events.push({
        type: "ai_analyzed",
        actor: req.user.id,
        data: { action: "bulk_retry" },
        createdAt: new Date(),
      });
      await comment.save();
      succeeded.push(id);
    }

    if (dryRun) {
      return sendSuccess(
        res,
        { totalMatched: succeeded.length, failed },
        `Dry run: ${succeeded.length} comments would be retried.`,
      );
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: "admin",
      action: "BULK_RETRY_COMMENTS_BY_IDS",
      targetType: "Comment",
      details: {
        commentIds,
        succeededCount: succeeded.length,
        failedCount: failed.length,
      },
      req,
    });

    logger.info(
      `Admin ${req.user.id} bulk retried ${succeeded.length} comments by IDs`,
    );

    return sendSuccess(
      res,
      { succeeded, failed },
      `Bulk retry completed: ${succeeded.length} succeeded, ${failed.length} failed.`,
    );
  } catch (err) {
    console.error("=== BULK RETRY BY IDS ERROR ===", err);
    logger.error(
      { error: err.message, stack: err.stack },
      "Bulk retry by IDs error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to process bulk retry",
      null,
      500,
    );
  }
};

// Soft delete a single comment (version)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );
    }

    comment.visibility = "deleted";
    comment.events.push({
      type: "deleted",
      actor: req.user.id,
      data: { note: "admin_deleted" },
      createdAt: new Date(),
    });
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "DELETE_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { policyId: comment.policyId },
      req,
    });

    logger.info(`Admin ${req.user.id} deleted comment ${id}`);
    return sendSuccess(res, null, "Comment deleted successfully");
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Delete comment error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to delete comment",
      null,
      500,
    );
  }
};

// ========== CITIZEN MANAGEMENT ==========

// GET /admin/users/citizens
exports.listCitizens = async (req, res) => {
  try {
    const { active, page = 1, limit = 10 } = req.query;
    const query = { role: "citizen" };
    if (active !== undefined) query.active = active === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [citizens, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash -phoneHash")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    logger.info(
      `Admin ${req.user.id} listed citizens (page ${page}, total ${total})`,
    );
    return sendSuccess(
      res,
      {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        citizens,
      },
      "Citizens retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "List citizens error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve citizens",
      null,
      500,
    );
  }
};

// PUT /admin/users/:id/status
exports.updateCitizenStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    if (active === undefined) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "active field is required (true/false)",
        null,
        400,
      );
    }

    const user = await User.findOne({ _id: id, role: "citizen" });
    if (!user) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Citizen not found",
        null,
        404,
      );
    }

    user.active = active;
    await user.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_CITIZEN_STATUS",
      targetType: "User",
      targetId: user._id,
      details: { email: user.email, active: user.active },
      req,
    });

    const statusText = active ? "activated" : "deactivated";
    logger.info(
      `Admin ${req.user.id} ${statusText} citizen: ${user.email} (${user._id})`,
    );
    return sendSuccess(
      res,
      { userId: user._id, active: user.active },
      `Citizen account ${statusText} successfully`,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Update citizen status error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update citizen status",
      null,
      500,
    );
  }
};

// ========== PASSWORD RESET (ADMIN INITIATED) ==========

exports.initiatePasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }

    if (user._id.toString() === req.user.id.toString()) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Use /auth/forgot-password to reset your own password",
        null,
        403,
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenKey = `reset:token:${token}`;
    await client.setEx(tokenKey, 3600, user._id.toString());

    await sendAdminInitiatedResetEmail(user.email, token);

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "INITIATE_PASSWORD_RESET",
      targetType: "User",
      targetId: user._id,
      details: { email: user.email },
      req,
    });

    logger.info(
      `Admin ${req.user.id} initiated password reset for user ${user.email}`,
    );
    return sendSuccess(
      res,
      null,
      `Password reset email sent to ${user.email}. The user will receive a link to set a new password.`,
      200,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Admin initiate password reset error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to initiate password reset",
      null,
      500,
    );
  }
};

// ========== NEW: REPORT MANAGEMENT ==========

// GET /admin/comments/:commentId/reports
exports.getCommentReports = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId)
      .populate("reports.reporterId", "email firstName lastName")
      .lean();
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    const reports = comment.reports.map((report) => ({
      id: report._id,
      reason: report.reason,
      details: report.details,
      status: report.status,
      moderatorNote: report.moderatorNotes,
      reportedBy: report.reporterId
        ? {
            id: report.reporterId._id,
            email: report.reporterId.email,
            firstName: report.reporterId.firstName,
            lastName: report.reporterId.lastName,
          }
        : null,
      snapshot: report.snapshot,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt || null,
    }));

    return sendSuccess(
      res,
      {
        commentId: comment._id,
        reportState: comment.reportState,
        reportCount: comment.reportCount,
        reports,
      },
      "Comment reports retrieved",
    );
  } catch (err) {
    logger.error({ error: err.message }, "Get comment reports error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve reports",
      null,
      500,
    );
  }
};

// PUT /admin/comments/:commentId/reports/:reportId
exports.resolveReport = async (req, res) => {
  try {
    const { commentId, reportId } = req.params;
    const { resolution, moderatorNote = "" } = req.body;
    if (!["valid", "invalid", "resolved"].includes(resolution)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Resolution must be 'valid', 'invalid', or 'resolved'",
        null,
        400,
      );
    }

    const comment = await Comment.findById(commentId);
    if (!comment)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Comment not found",
        null,
        404,
      );

    const report = comment.reports.id(reportId);
    if (!report)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Report not found",
        null,
        404,
      );

    report.status = resolution;
    report.resolvedAt = new Date();
    report.resolvedBy = req.user.id;
    report.moderatorNotes = moderatorNote;

    if (resolution === "valid" && comment.visibility === "visible") {
      comment.visibility = "hidden";
      comment.moderationActions.push({
        action: "hide",
        reason: "report_validated",
        actor: req.user.id,
        createdAt: new Date(),
      });
      comment.reportState = "actioned";
    }

    comment.events.push({
      type: "moderated",
      actor: req.user.id,
      data: { action: "resolve_report", reportId, resolution, moderatorNote },
      createdAt: new Date(),
    });
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RESOLVE_REPORT",
      targetType: "Comment",
      targetId: comment._id,
      details: { reportId, resolution, moderatorNote },
      req,
    });

    return sendSuccess(res, { reportId, resolution }, "Report resolved");
  } catch (err) {
    logger.error({ error: err.message }, "Resolve report error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to resolve report",
      null,
      500,
    );
  }
};

// ========== NEW: APPEAL MANAGEMENT ==========

// GET /admin/appeals
exports.getAppeals = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const filter = { "appeal.status": status };
    const comments = await Comment.find(filter)
      .populate("userId", "email firstName lastName")
      .populate("policyId", "title")
      .populate("appeal.appellantId", "email firstName lastName")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    const appeals = comments.map((c) => ({
      commentId: c._id,
      text: c.text,
      policy: c.policyId?.title || "Unknown policy",
      appeal: c.appeal,
      appellant: c.appeal?.appellantId,
      createdAt: c.createdAt,
    }));

    const total = await Comment.countDocuments(filter);

    return sendSuccess(
      res,
      {
        appeals,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      },
      "Appeals retrieved",
    );
  } catch (err) {
    logger.error({ error: err.message }, "Get appeals error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve appeals",
      null,
      500,
    );
  }
};

// POST /admin/appeals/:commentId/resolve
exports.resolveAppeal = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { decision, moderatorNote = "" } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Decision must be 'approved' or 'rejected'",
        null,
        400,
      );
    }

    const comment = await Comment.findById(commentId);
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
        "No pending appeal found",
        null,
        400,
      );
    }

    comment.appeal.status = decision;
    comment.appeal.resolvedAt = new Date();
    comment.appeal.resolvedBy = req.user.id;
    comment.appeal.moderatorNotes = moderatorNote;

    if (decision === "approved") {
      comment.visibility = "visible";
      comment.moderationActions.push({
        action: "restore",
        reason: "appeal approved",
        actor: req.user.id,
        createdAt: new Date(),
      });
      comment.reportState = "actioned";
    } else {
      comment.moderationActions.push({
        action: "reject_appeal",
        reason: moderatorNote || "appeal rejected",
        actor: req.user.id,
        createdAt: new Date(),
      });
    }

    comment.events.push({
      type: "appeal_resolved",
      actor: req.user.id,
      data: { decision, moderatorNote },
      createdAt: new Date(),
    });
    await comment.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RESOLVE_APPEAL",
      targetType: "Comment",
      targetId: comment._id,
      details: { decision, moderatorNote },
      req,
    });

    return sendSuccess(res, comment.appeal, "Appeal resolved");
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
