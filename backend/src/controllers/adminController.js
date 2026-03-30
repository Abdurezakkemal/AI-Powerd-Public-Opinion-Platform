const User = require("../models/User");
const { hashPassword } = require("../utils/helpers");

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
      phoneHash: null, // ✅ FIXED
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

    // ✅ ACTIVE FLAG SUPPORT (CRITICAL FIX)
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
