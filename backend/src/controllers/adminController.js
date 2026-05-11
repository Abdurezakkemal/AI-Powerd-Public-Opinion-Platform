const User = require("../models/User");
const Comment = require("../models/Comment");
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

// GET /admin/planners?active=true&page=1&limit=10
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
    console.log("=== CREATE PLANNER START ===");
    console.log("Request Body:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Validation failed: Email or password missing");
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Email and password are required",
        { required: ["email", "password"] },
        400,
      );
    }

    console.log("Step 1: Checking for existing user...");
    const existing = await User.findOne({ email });
    console.log("Existing user found?", !!existing);

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

    // Hash Password
    console.log("Step 2: Hashing password...");
    const passwordHash = await hashPassword(password);
    console.log("Password hashed successfully");

    // Use a unique placeholder for phoneHash (planners don't have phone)
    const uniquePhonePlaceholder = `planner_no_phone_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    console.log("Step 3: Creating new User object...");
    const planner = new User({
      email,
      passwordHash,
      role: "planner",
      phoneHash: uniquePhonePlaceholder, // ← Fixed here
      region: "",
      verified: true,
      active: true,
    });

    console.log("User object created, about to save...");
    await planner.save();
    console.log("✅ User saved successfully! ID:", planner._id);

    // Audit Log
    console.log("Step 4: Creating audit log...");
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "CREATE_PLANNER",
      targetType: "User",
      targetId: planner._id,
      details: { email: planner.email },
      req,
    });
    console.log("Audit log created successfully");

    logger.info(
      `Admin ${req.user.id} created planner: ${email} (${planner._id})`,
    );

    console.log("=== CREATE PLANNER SUCCESS ===");

    return sendSuccess(
      res,
      { id: planner._id, email: planner.email },
      "Planner account created successfully",
      201,
    );
  } catch (err) {
    console.error("=== CREATE PLANNER FAILED ===");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Error Code:", err.code);

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
    if (password) {
      planner.passwordHash = await hashPassword(password);
      changes.password = "updated";
    }
    if (active !== undefined) {
      planner.active = active;
      changes.active = active;
    }
    await planner.save();

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
      { id: planner._id, email: planner.email, active: planner.active },
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

    planner.active = active;
    await planner.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_PLANNER_STATUS",
      targetType: "User",
      targetId: planner._id,
      details: { email: planner.email, active: planner.active },
      req,
    });

    const statusText = active ? "activated" : "deactivated";
    logger.info(
      `Admin ${req.user.id} ${statusText} planner: ${planner.email} (${planner._id})`,
    );
    return sendSuccess(
      res,
      { plannerId: planner._id, active: planner.active },
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

// ========== COMMENT MANAGEMENT (formerly FEEDBACK) ==========

// GET /admin/comments/pending
exports.getPendingComments = async (req, res) => {
  try {
    const comments = await Comment.find({ moderationStatus: "needs_review" })
      .populate("policyId", "title")
      .populate("userId", "email")
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
// GET /admin/comments/flagged
exports.getFlaggedComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      moderationReason: "reports",
      moderationStatus: "needs_review",
    })
      .populate("policyId", "title")
      .populate("userId", "email")
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
// PUT /admin/comments/:id
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { sentiment, keywords, moderationStatus, moderationReason } =
      req.body;
    const updateData = {};
    if (sentiment !== undefined) updateData.sentiment = sentiment;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (moderationStatus !== undefined)
      updateData.moderationStatus = moderationStatus;
    if (moderationReason !== undefined)
      updateData.moderationReason = moderationReason;

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

// POST /admin/comments/:id/retry
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
    if (comment.moderationStatus !== "needs_review") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only comments in needs_review can be retried. Current: ${comment.moderationStatus}`,
        null,
        400,
      );
    }
    comment.moderationStatus = "pending_ai";
    comment.moderationReason = "pending_ai";
    comment.retryCount = 0;
    comment.nextRetry = null;
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

    logger.info(`Admin ${req.user.id} queued comment ${id} for retry`);
    return sendSuccess(
      res,
      { commentId: id },
      "Comment queued for retry. AI worker will process.",
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

// POST /admin/comments/retry-all
exports.retryAllComments = async (req, res) => {
  try {
    const result = await Comment.updateMany(
      { status: "pending_review" },
      {
        $set: {
          processed: false,
          retryCount: 0,
          nextRetry: null,
          status: "processing",
        },
      },
    );

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RETRY_ALL_COMMENTS",
      details: { count: result.modifiedCount },
      req,
    });

    logger.info(
      `Admin ${req.user.id} queued ${result.modifiedCount} comments for retry`,
    );
    return sendSuccess(
      res,
      { updatedCount: result.modifiedCount },
      `${result.modifiedCount} comments queued for retry`,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Retry all comments error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to queue comments for retry",
      null,
      500,
    );
  }
};

// DELETE /admin/comments/:id
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

    await comment.deleteOne();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "DELETE_COMMENT",
      targetType: "Comment",
      targetId: comment._id,
      details: { commentText: comment.comment?.substring(0, 100) },
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

// GET /admin/users/citizens?active=true&page=1&limit=10
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

// POST /admin/users/:id/initiate-password-reset
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
