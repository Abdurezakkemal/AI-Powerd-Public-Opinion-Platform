const User = require("../models/User");
const PlannerRequest = require("../models/PlannerRequest");
const Policy = require("../models/Policy");
const PolicyAssociate = require("../models/PolicyAssociate");
const { createAuditLog } = require("../utils/audit");
const { createNotification } = require("../services/notificationService");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");
const { sendEmail } = require("../utils/email");

// ==================== CITIZEN REQUESTS TO BECOME PLANNER ====================
exports.requestPlanner = async (req, res) => {
  try {
    const { organization, reason, proofFile } = req.body;
    if (!reason || reason.length < 50) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Reason must be at least 50 characters.",
        null,
        400,
      );
    }
    const userId = req.user.id;
    const existing = await PlannerRequest.findOne({
      userId,
      status: "pending",
    });
    if (existing) {
      return sendError(
        res,
        ErrorCodes.DUPLICATE,
        "You already have a pending request. Please wait for admin review.",
        null,
        409,
      );
    }
    const request = new PlannerRequest({
      userId,
      organization: organization || "",
      reason,
      proofFile: proofFile || null,
    });
    await request.save();
    await createAuditLog({
      userId,
      userRole: "citizen",
      action: "PLANNER_REQUEST_CREATED",
      details: { organization, reasonPreview: reason.slice(0, 100) },
      req,
    });
    return sendSuccess(
      res,
      { requestId: request._id },
      "Your request has been submitted. Admins will review it.",
      201,
    );
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to submit request. Please try again.",
      null,
      500,
    );
  }
};

// ==================== ADMIN ENDPOINTS ====================
exports.listPendingRequests = async (req, res) => {
  try {
    const requests = await PlannerRequest.find({ status: "pending" })
      .populate(
        "userId",
        "email region ageRange gender occupation education createdAt",
      )
      .sort({ createdAt: -1 });
    return sendSuccess(res, requests);
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to fetch requests",
      null,
      500,
    );
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await PlannerRequest.findById(id);
    if (!request)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Request not found",
        null,
        404,
      );
    if (request.status !== "pending")
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Request already ${request.status}`,
        null,
        400,
      );
    const user = await User.findById(request.userId);
    if (!user)
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    user.role = "planner";
    user.tokenVersion += 1;
    await user.save();
    request.status = "approved";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();
    await createAuditLog({
      userId: user._id,
      userRole: "admin",
      action: "PLANNER_APPROVED",
      details: { approvedBy: req.user.id },
      req,
    });
    await sendEmail({
      to: user.email,
      subject: "Planner Request Approved",
      html: `<p>Congratulations! You are now a planner. Please log in and complete the mandatory training before creating policies.</p>`,
    });
    // In‑app notification
    await createNotification({
      userId: user._id,
      type: "PLANNER_APPROVED",
      title: "Planner Request Approved",
      message: `Congratulations! You are now a planner. Please log in and complete the mandatory training.`,
      data: {},
      severity: "info",
      source: "system",
    });
    return sendSuccess(
      res,
      null,
      "Planner request approved. User role updated.",
    );
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to approve request",
      null,
      500,
    );
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    if (!rejectionReason || rejectionReason.length < 10)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Rejection reason must be at least 10 characters.",
        null,
        400,
      );
    const request = await PlannerRequest.findById(id);
    if (!request)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Request not found",
        null,
        404,
      );
    if (request.status !== "pending")
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Request already ${request.status}`,
        null,
        400,
      );
    request.status = "rejected";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason;
    await request.save();
    const user = await User.findById(request.userId);
    if (user) {
      await sendEmail({
        to: user.email,
        subject: "Planner Request Rejected",
        html: `<p>Your request to become a planner was rejected. Reason: ${rejectionReason}</p>`,
      });
    }
    await createAuditLog({
      userId: req.user.id,
      userRole: "admin",
      action: "PLANNER_REJECTED",
      details: { requestId: id, reason: rejectionReason },
      req,
    });
    return sendSuccess(res, null, "Request rejected.");
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to reject request",
      null,
      500,
    );
  }
};

// ==================== TRAINING COMPLETION (PLANNER ONLY) ====================
exports.completeTraining = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "planner")
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only planners can complete training.",
        null,
        403,
      );
    if (user.trainingCompletedAt)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Training already completed.",
        null,
        400,
      );
    const completedAt = new Date();
    await User.updateOne(
      { _id: user._id },
      { $set: { trainingCompletedAt: completedAt } },
      { runValidators: false },
    );
    await createAuditLog({
      userId: user._id,
      userRole: "planner",
      action: "TRAINING_COMPLETED",
      details: {},
      req,
    });
    return sendSuccess(
      res,
      null,
      "Training completed. You can now create policies.",
    );
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to complete training",
      null,
      500,
    );
  }
};

// ========== SEARCH PLANNERS BY LANGUAGE ==========
exports.searchPlannersByLanguage = async (req, res) => {
  try {
    const { language } = req.query;

    let query = { role: "planner", active: true, deletedAt: null };

    // If language is specified and not "all", filter by language
    if (
      language &&
      language !== "all" &&
      ["am", "om", "ti", "en"].includes(language)
    ) {
      query.languagesSpoken = language;
    }

    const planners = await User.find(query)
      .select("email region languagesSpoken trainingCompletedAt")
      .limit(50);
    return sendSuccess(res, planners, "Planners found");
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to search planners",
      null,
      500,
    );
  }
};

// ========== ADD ASSOCIATE ==========
exports.addAssociate = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { plannerEmail, permissions } = req.body;
    if (!plannerEmail || !permissions || !permissions.length) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "plannerEmail and permissions array required",
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

    // FIX: use .toString() on both sides
    const isOwner = policy.createdBy.toString() === req.user.id.toString();
    if (req.user.role !== "admin" && !isOwner) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only policy owner can add associates",
        null,
        403,
      );
    }

    const associateUser = await User.findOne({
      email: plannerEmail,
      role: "planner",
      active: true,
    });
    if (!associateUser)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Planner not found with that email",
        null,
        404,
      );
    if (
      associateUser._id.toString() === req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "You cannot assign yourself as associate",
        null,
        400,
      );
    }

    const existing = await PolicyAssociate.findOne({
      policyId,
      plannerId: associateUser._id,
      revokedAt: null,
    });
    if (existing) {
      return sendError(
        res,
        ErrorCodes.DUPLICATE,
        "This planner is already an associate (active). Update permissions instead.",
        null,
        409,
      );
    }

    const associate = new PolicyAssociate({
      policyId,
      plannerId: associateUser._id,
      permissions,
      assignedBy: req.user.id,
    });
    await associate.save();

    // Notifications (skip if not ready)
    try {
      const { createNotification } = require("../services/notificationService");
      await createNotification({
        userId: associateUser._id,
        type: "ASSOCIATE_ASSIGNED",
        title: "Policy Associate Role",
        message: `You have been assigned as an associate on policy "${policy.title}" with permissions: ${permissions.join(", ")}.`,
        data: { policyId, permissions },
        severity: "info",
        source: "system",
      });
    } catch (notifErr) {
      console.error("Notification skipped:", notifErr.message);
    }

    await sendEmail({
      to: associateUser.email,
      subject: `You are now an associate for policy: ${policy.title}`,
      html: `<p>You have been assigned by ${req.user.id} to help manage policy "${policy.title}".</p><p>Permissions: ${permissions.join(", ")}.</p>`,
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "ADD_ASSOCIATE",
      targetType: "PolicyAssociate",
      targetId: associate._id,
      details: { policyId, plannerId: associateUser._id, permissions },
      req,
    });

    return sendSuccess(res, associate, "Associate added successfully");
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to add associate",
      null,
      500,
    );
  }
};

// ========== LIST ASSOCIATES ==========
exports.listAssociates = async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    const isOwner = policy.createdBy.toString() === req.user.id.toString();
    if (req.user.role !== "admin" && !isOwner) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only policy owner can view associates",
        null,
        403,
      );
    }
    const associates = await PolicyAssociate.find({ policyId, revokedAt: null })
      .populate("plannerId", "email region languagesSpoken")
      .populate("assignedBy", "email");
    return sendSuccess(res, associates, "Associates retrieved");
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to list associates",
      null,
      500,
    );
  }
};

// ========== UPDATE ASSOCIATE PERMISSIONS ==========
exports.updateAssociatePermissions = async (req, res) => {
  try {
    const { policyId, associateId } = req.params;
    const { permissions } = req.body;
    if (!permissions || !permissions.length)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "permissions array required",
        null,
        400,
      );
    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    const isOwner = policy.createdBy.toString() === req.user.id.toString();
    if (req.user.role !== "admin" && !isOwner) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only policy owner can update permissions",
        null,
        403,
      );
    }
    const associate = await PolicyAssociate.findOne({
      _id: associateId,
      policyId,
      revokedAt: null,
    });
    if (!associate)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Active associate not found",
        null,
        404,
      );
    associate.permissions = permissions;
    await associate.save();
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_ASSOCIATE_PERMISSIONS",
      targetType: "PolicyAssociate",
      targetId: associate._id,
      details: { permissions },
      req,
    });

    // In‑app notification to associate
    await createNotification({
      userId: associate.plannerId,
      type: "ASSOCIATE_PERMISSIONS_UPDATED",
      title: "Permissions Updated",
      message: `Your permissions for policy "${policy.title}" have been updated to: ${permissions.join(", ")}.`,
      data: { policyId, permissions },
      severity: "info",
      source: "system",
    });

    return sendSuccess(res, associate, "Permissions updated");
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update permissions",
      null,
      500,
    );
  }
};

// ========== REVOKE ASSOCIATE ==========
exports.revokeAssociate = async (req, res) => {
  try {
    const { policyId, associateId } = req.params;
    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    const isOwner = policy.createdBy.toString() === req.user.id.toString();
    if (req.user.role !== "admin" && !isOwner) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only policy owner can revoke associates",
        null,
        403,
      );
    }
    const associate = await PolicyAssociate.findOne({
      _id: associateId,
      policyId,
      revokedAt: null,
    });
    if (!associate)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Active associate not found",
        null,
        404,
      );
    associate.revokedAt = new Date();
    await associate.save();
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "REVOKE_ASSOCIATE",
      targetType: "PolicyAssociate",
      targetId: associate._id,
      details: { policyId, plannerId: associate.plannerId },
      req,
    });

    // In‑app notification to associate
    await createNotification({
      userId: associate.plannerId,
      type: "ASSOCIATE_REVOKED",
      title: "Associate Role Revoked",
      message: `You have been removed as an associate from policy "${policy.title}".`,
      data: { policyId },
      severity: "info",
      source: "system",
    });

    return sendSuccess(res, null, "Associate revoked");
  } catch (err) {
    console.error(err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to revoke associate",
      null,
      500,
    );
  }
};
