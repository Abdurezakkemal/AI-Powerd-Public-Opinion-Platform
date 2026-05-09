const User = require("../models/User");
const PlannerRequest = require("../models/PlannerRequest");
const { createAuditLog } = require("../utils/audit");
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

    // Optional: notify all admins (can be done via email or in‑app later)

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
    if (!request) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Request not found",
        null,
        404,
      );
    }
    if (request.status !== "pending") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Request already ${request.status}`,
        null,
        400,
      );
    }

    const user = await User.findById(request.userId);
    if (!user) {
      return sendError(res, ErrorCodes.NOT_FOUND, "User not found", null, 404);
    }

    // Update user role to planner
    user.role = "planner";
    user.tokenVersion += 1; // invalidate old JWTs
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

    // Send email notification
    await sendEmail({
      to: user.email,
      subject: "Planner Request Approved",
      html: `<p>Congratulations! You are now a planner. Please log in and complete the mandatory training before creating policies.</p>`,
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
    if (!rejectionReason || rejectionReason.length < 10) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Rejection reason must be at least 10 characters.",
        null,
        400,
      );
    }

    const request = await PlannerRequest.findById(id);
    if (!request) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Request not found",
        null,
        404,
      );
    }
    if (request.status !== "pending") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Request already ${request.status}`,
        null,
        400,
      );
    }

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
    if (user.role !== "planner") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only planners can complete training.",
        null,
        403,
      );
    }
    if (user.trainingCompletedAt) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Training already completed.",
        null,
        400,
      );
    }
    user.trainingCompletedAt = new Date();
    await user.save();

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
