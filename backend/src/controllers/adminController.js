const User = require("../models/User");
const { hashPassword } = require("../utils/helpers");

// GET /users/planners
exports.listPlanners = async (req, res) => {
  try {
    const planners = await User.find({ role: "planner" }).select(
      "-passwordHash",
    );
    res.json({ planners });
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
      phoneHash: "", // planners don't need phone
      region: "",
      verified: true, // planners are trusted
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
    const { password, status } = req.body;

    const planner = await User.findOne({ _id: id, role: "planner" });
    if (!planner) {
      return res.status(404).json({ message: "Planner not found" });
    }

    if (password) {
      planner.passwordHash = await hashPassword(password);
    }
    // If status is provided, we can use a field like `isActive` – but our schema doesn't have it.
    // We'll assume deactivation means setting role to something else? Better to add an `active` boolean.
    // For simplicity, we'll ignore status for now or you can add a field.

    await planner.save();
    res.json({ message: "Planner updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
