const User = require("../models/User");
const Feedback = require("../models/Feedback");
const { hashPassword } = require("../utils/helpers");
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
    console.error("List planners error:", err);
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
    console.error("Create planner error:", err);
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

    if (password) {
      planner.passwordHash = await hashPassword(password);
    }
    if (active !== undefined) {
      planner.active = active;
    }
    await planner.save();

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
    console.error("Update planner error:", err);
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
    return sendSuccess(
      res,
      { feedbacks },
      "Pending feedback retrieved successfully",
    );
  } catch (err) {
    console.error("Get pending feedback error:", err);
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
    return sendSuccess(res, feedback, "Feedback updated successfully");
  } catch (err) {
    console.error("Update feedback error:", err);
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

    return sendSuccess(
      res,
      { feedbackId: id },
      "Feedback queued for retry. The AI worker will process it shortly.",
    );
  } catch (err) {
    console.error("Retry feedback error:", err);
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
    return sendSuccess(
      res,
      { updatedCount: result.modifiedCount },
      `${result.modifiedCount} feedback items queued for retry`,
    );
  } catch (err) {
    console.error("Retry all feedback error:", err);
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
    console.error("List citizens error:", err);
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

    const statusText = active ? "activated" : "deactivated";
    return sendSuccess(
      res,
      { userId: user._id, active: user.active },
      `Citizen account ${statusText} successfully`,
    );
  } catch (err) {
    console.error("Update citizen status error:", err);
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

    const statusText = active ? "activated" : "deactivated";
    return sendSuccess(
      res,
      { plannerId: planner._id, active: planner.active },
      `Planner account ${statusText} successfully`,
    );
  } catch (err) {
    console.error("Update planner status error:", err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update planner status",
      null,
      500,
    );
  }
};
