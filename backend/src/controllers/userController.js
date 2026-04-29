const User = require("../models/User");
const Vote = require("../models/Vote");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const client = require("../config/redis");
const {
  hashPassword,
  comparePassword,
  generateOTP,
} = require("../utils/helpers");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
const { sendOtpEmail } = require("../utils/email");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

// GET /users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-passwordHash -phoneHash",
    );
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }
    logger.info(`User ${req.user.id} retrieved their profile`);
    return sendSuccess(res, user, "User profile retrieved successfully");
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Get user error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve user profile",
      null,
      500,
    );
  }
};

// PUT /users/me – only region can be updated (email removed for security)
exports.updateMe = async (req, res) => {
  try {
    const { region } = req.body;
    const updates = {};
    if (region) updates.region = region;

    if (Object.keys(updates).length === 0) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "No valid fields provided for update (only region is allowed)",
        null,
        400,
      );
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-passwordHash -phoneHash");
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: user.role,
      action: "UPDATE_PROFILE",
      details: { updatedFields: Object.keys(updates) },
      req,
    });

    logger.info(
      `User ${req.user.id} updated profile: ${Object.keys(updates).join(", ")}`,
    );
    return sendSuccess(res, user, "User profile updated successfully");
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Update user error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update user profile",
      null,
      500,
    );
  }
};

// PUT /users/me/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Current password and new password are required",
        null,
        400,
      );
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      logger.warn(
        `User ${req.user.id} attempted password change with incorrect current password`,
      );
      return sendError(
        res,
        ErrorCodes.INVALID_CREDENTIALS,
        "Current password is incorrect",
        null,
        401,
      );
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: user.role,
      action: "CHANGE_PASSWORD",
      details: {},
      req,
    });

    logger.info(`User ${req.user.id} changed password`);
    return sendSuccess(res, null, "Password changed successfully");
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Change password error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to change password",
      null,
      500,
    );
  }
};

// GET /users/me/history
exports.getHistory = async (req, res) => {
  try {
    const votes = await Vote.find({ userId: req.user.id })
      .populate("policyId", "title policyCode")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = [];
    for (const vote of votes) {
      const comment = await Comment.findOne({ voteId: vote._id }).lean();
      formatted.push({
        id: vote._id,
        policy: vote.policyId
          ? {
              id: vote.policyId._id,
              title: vote.policyId.title,
              policyCode: vote.policyId.policyCode,
            }
          : null,
        rating: vote.rating,
        comment: comment?.comment || null,
        channel: vote.channel,
        sentiment: comment?.sentiment?.label || null,
        createdAt: vote.createdAt,
      });
    }

    logger.info(
      `User ${req.user.id} retrieved history (${formatted.length} items)`,
    );
    return sendSuccess(
      res,
      { history: formatted },
      "User history retrieved successfully",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Get history error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve history",
      null,
      500,
    );
  }
};

// DELETE /users/me
exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }

    const originalEmail = user.email;

    user.email = `deleted_${user._id}@deleted.com`;
    user.passwordHash = "deleted";
    user.phoneHash = null;
    user.active = false;
    user.verified = false;
    await user.save();

    await Vote.updateMany({ userId: userId }, { $unset: { userId: "" } });
    await Comment.updateMany({ userId: userId }, { $unset: { userId: "" } });

    await createAuditLog({
      userId: userId,
      userRole: user.role,
      action: "DELETE_ACCOUNT",
      details: { email: originalEmail },
      req,
    });

    logger.info(`User ${userId} (${originalEmail}) deleted their account`);
    return sendSuccess(
      res,
      null,
      "Account deleted successfully. Your data has been anonymized.",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Delete account error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to delete account",
      null,
      500,
    );
  }
};

// ==================== EMAIL CHANGE (with verification) ====================

// POST /users/me/email/request
exports.requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    if (!newEmail) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "New email is required",
        null,
        400,
      );
    }

    // Check if new email already used
    const existing = await User.findOne({ email: newEmail });
    if (existing && existing._id.toString() !== userId) {
      return sendError(
        res,
        ErrorCodes.DUPLICATE,
        "Email already in use by another account",
        null,
        409,
      );
    }

    // Rate limit (3 requests per hour)
    const rateKey = `email_change:rate:${userId}`;
    const rateAttempts = await client.incr(rateKey);
    if (rateAttempts === 1) await client.expire(rateKey, 3600);
    if (rateAttempts > 3) {
      logger.warn(`Email change rate limit exceeded for user ${userId}`);
      return sendError(
        res,
        ErrorCodes.RATE_LIMIT,
        "Too many email change requests. Please try again later.",
        null,
        429,
      );
    }

    const otp = generateOTP();
    const otpKey = `email_change:otp:${userId}`;
    await client.setEx(otpKey, 300, JSON.stringify({ otp, newEmail }));

    await sendOtpEmail(newEmail, otp);

    logger.info(`Email change OTP sent to ${newEmail} for user ${userId}`);
    return sendSuccess(
      res,
      null,
      "Verification code sent to the new email address. It expires in 5 minutes.",
      200,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Request email change error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to request email change",
      null,
      500,
    );
  }
};

// POST /users/me/email/verify
exports.verifyEmailChange = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Verification code is required",
        null,
        400,
      );
    }

    const otpKey = `email_change:otp:${userId}`;
    const data = await client.get(otpKey);
    if (!data) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "No pending email change request or code expired. Please request a new one.",
        null,
        400,
      );
    }

    const { otp, newEmail } = JSON.parse(data);
    if (otp !== code) {
      logger.warn(`Invalid email change OTP for user ${userId}`);
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Invalid verification code",
        null,
        400,
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }

    const oldEmail = user.email;
    user.email = newEmail;
    await user.save();

    await client.del(otpKey);

    await createAuditLog({
      userId: user._id,
      userRole: user.role,
      action: "CHANGE_EMAIL",
      details: { oldEmail, newEmail },
      req,
    });

    logger.info(`User ${userId} changed email from ${oldEmail} to ${newEmail}`);
    return sendSuccess(res, null, "Email address updated successfully.", 200);
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Verify email change error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to verify email change",
      null,
      500,
    );
  }
};

// ==================== NOTIFICATIONS ====================

// GET /users/me/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const filter = { userId: req.user.id };
    if (unreadOnly === "true") filter.read = false;

    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    logger.info(
      `User ${req.user.id} retrieved notifications (page ${page}, total ${total})`,
    );
    return sendSuccess(
      res,
      { notifications, total, page: Number(page) },
      "Notifications retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get notifications error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve notifications",
      null,
      500,
    );
  }
};

// PATCH /users/me/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true },
    );
    if (!notification) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Notification not found",
        null,
        404,
      );
    }

    logger.info(
      `User ${req.user.id} marked notification ${req.params.id} as read`,
    );
    return sendSuccess(res, notification, "Notification marked as read");
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Mark notification read error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to mark notification as read",
      null,
      500,
    );
  }
};

// PATCH /users/me/notifications/read-all
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true },
    );

    logger.info(
      `User ${req.user.id} marked all notifications as read (${result.modifiedCount} updated)`,
    );
    return sendSuccess(
      res,
      { modifiedCount: result.modifiedCount },
      "All notifications marked as read",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Mark all notifications read error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to mark notifications as read",
      null,
      500,
    );
  }
};
