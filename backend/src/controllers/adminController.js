const User = require("../models/User");
const Feedback = require("../models/Feedback");
const { hashPassword } = require("../utils/helpers");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
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
    const planner = new User({
      email,
      passwordHash,
      role: "planner",
      phoneHash: null,
      region: "",
      verified: true,
      active: true,
    });
    await planner.save();

    // Audit log
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
      {
        id: planner._id,
        email: planner.email,
      },
      "Planner account created successfully",
      201,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
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

    // Audit log
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
        active: planner.active,
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

// ========== FEEDBACK MANAGEMENT ==========

// GET /admin/feedback/pending
exports.getPendingFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ status: "pending review" })
      .populate("policyId", "title")
      .populate("userId", "email")
      .sort({ createdAt: -1 });
    logger.info(
      `Admin ${req.user.id} retrieved ${feedbacks.length} pending feedback items`,
    );
    return sendSuccess(
      res,
      { feedbacks },
      "Pending feedback retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get pending feedback error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve pending feedback",
      null,
      500,
    );
  }
};

// PUT /admin/feedback/:id
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ["sentiment", "keywords", "processed", "status"];
    const updateData = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) updateData[key] = updates[key];
    }

    const feedback = await Feedback.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!feedback) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Feedback not found",
        null,
        404,
      );
    }

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_FEEDBACK",
      targetType: "Feedback",
      targetId: feedback._id,
      details: { policyId: feedback.policyId, updates: updateData },
      req,
    });

    logger.info(`Admin ${req.user.id} updated feedback ${id}`);

    return sendSuccess(res, feedback, "Feedback updated successfully");
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Update feedback error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update feedback",
      null,
      500,
    );
  }
};

// POST /admin/feedback/:id/retry
exports.retryFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Feedback not found",
        null,
        404,
      );
    }

    feedback.processed = false;
    feedback.retryCount = 0;
    feedback.nextRetry = null;
    feedback.status = "processing";
    await feedback.save();

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RETRY_FEEDBACK",
      targetType: "Feedback",
      targetId: feedback._id,
      details: { policyId: feedback.policyId },
      req,
    });

    logger.info(`Admin ${req.user.id} queued feedback ${id} for retry`);

    return sendSuccess(
      res,
      { feedbackId: id },
      "Feedback queued for retry. The AI worker will process it shortly.",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Retry feedback error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to queue feedback for retry",
      null,
      500,
    );
  }
};

// POST /admin/feedback/retry-all
exports.retryAllFeedback = async (req, res) => {
  try {
    const result = await Feedback.updateMany(
      { status: "pending review" },
      {
        $set: {
          processed: false,
          retryCount: 0,
          nextRetry: null,
          status: "processing",
        },
      },
    );

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RETRY_ALL_FEEDBACK",
      details: { count: result.modifiedCount },
      req,
    });

    logger.info(
      `Admin ${req.user.id} queued ${result.modifiedCount} feedback items for retry`,
    );

    return sendSuccess(
      res,
      { updatedCount: result.modifiedCount },
      `${result.modifiedCount} feedback items queued for retry`,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Retry all feedback error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to queue feedback for retry",
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

    // Audit log
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

    // Audit log
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
