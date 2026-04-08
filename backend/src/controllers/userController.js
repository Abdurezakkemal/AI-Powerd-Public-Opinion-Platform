const User = require("../models/User");
const Feedback = require("../models/Feedback");
const { hashPassword, comparePassword } = require("../utils/helpers");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
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

// PUT /users/me
exports.updateMe = async (req, res) => {
  try {
    const { email, region } = req.body;
    const updates = {};
    if (email) updates.email = email;
    if (region) updates.region = region;

    if (Object.keys(updates).length === 0) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "No valid fields provided for update",
        null,
        400,
      );
    }

    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== req.user.id) {
        logger.warn(
          `User ${req.user.id} attempted to use existing email ${email}`,
        );
        return sendError(
          res,
          ErrorCodes.DUPLICATE,
          "Email already in use by another account",
          null,
          409,
        );
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-passwordHash -phoneHash");
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }

    // Audit log for profile update
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

    // Audit log for password change
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
    const history = await Feedback.find({ userId: req.user.id })
      .populate("policyId", "title policyCode")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = history.map((h) => ({
      id: h._id,
      policy: h.policyId
        ? {
            id: h.policyId._id,
            title: h.policyId.title,
            policyCode: h.policyId.policyCode,
          }
        : null,
      rating: h.rating,
      comment: h.comment,
      channel: h.channel,
      sentiment: h.sentiment?.label || null,
      createdAt: h.createdAt,
    }));

    logger.info(
      `User ${req.user.id} retrieved feedback history (${history.length} items)`,
    );
    return sendSuccess(
      res,
      { history: formatted },
      "User feedback history retrieved successfully",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Get history error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve feedback history",
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

    // Capture email before anonymization for audit
    const originalEmail = user.email;

    user.email = `deleted_${user._id}@deleted.com`;
    user.passwordHash = "deleted";
    user.phoneHash = null;
    user.active = false;
    user.verified = false;
    await user.save();

    await Feedback.updateMany({ userId: userId }, { $unset: { userId: "" } });

    // Audit log for account deletion
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
