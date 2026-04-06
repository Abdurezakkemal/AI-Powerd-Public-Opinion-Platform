const User = require("../models/User");
const Feedback = require("../models/Feedback");
const { hashPassword } = require("../utils/helpers");

// ========== PLANNER MANAGEMENT ==========

// GET /users/planners?active=true&page=1&limit=10
exports.listPlanners = async (req, res) => {
  try {
    const { active, page = 1, limit = 10 } = req.query;

    const query = { role: "planner" };

    // Filtering
    if (active !== undefined) {
      query.active = active === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [planners, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      planners,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /users/planners
exports.createPlanner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
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

    res.status(201).json({
      id: planner._id,
      email: planner.email,
      message: "Planner created",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /users/planners/:id
exports.updatePlanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, active } = req.body;

    const planner = await User.findOne({ _id: id, role: "planner" });

    if (!planner) {
      return res.status(404).json({ message: "Planner not found" });
    }

    // Password reset
    if (password) {
      planner.passwordHash = await hashPassword(password);
    }

    // Active flag support
    if (active !== undefined) {
      planner.active = active;
    }

    await planner.save();

    res.json({
      message: "Planner updated",
      active: planner.active,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
    res.json({ feedbacks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /admin/feedback/:id
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Allowed fields
    const allowed = ["sentiment", "keywords", "processed", "status"];
    const updateData = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) updateData[key] = updates[key];
    }

    const feedback = await Feedback.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /admin/feedback/:id/retry
exports.retryFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });

    feedback.processed = false;
    feedback.retryCount = 0;
    feedback.nextRetry = null;
    feedback.status = "processing";
    await feedback.save();

    res.json({ message: "Feedback queued for retry" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// POST /admin/feedback/retry-all
exports.retryAllFeedback = async (req, res) => {
  try {
    // Target only feedback that needs retry
    const result = await Feedback.updateMany(
      {
        status: "pending review",
      },
      {
        $set: {
          processed: false,
          retryCount: 0,
          nextRetry: null,
          status: "processing",
        },
      },
    );

    res.json({
      message: "All pending feedback queued for retry",
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
