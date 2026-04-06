const User = require("../models/User");
const Feedback = require("../models/Feedback");
const { hashPassword, comparePassword } = require("../utils/helpers");

// GET /users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /users/me
exports.updateMe = async (req, res) => {
  try {
    const { email, region } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (region) updates.region = region;

    // Prevent empty update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    // Check email uniqueness
    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== req.user.id) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-passwordHash");

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /users/me/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /users/me/history
exports.getHistory = async (req, res) => {
  try {
    const history = await Feedback.find({ userId: req.user.id })
      .populate("policyId", "title")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// DELETE /users/me
exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Anonymize user
    user.email = `deleted_${user._id}@deleted.com`;
    user.passwordHash = "deleted";
    user.phoneHash = null;
    user.active = false;
    user.verified = false;

    await user.save();

    // Optional: remove userId from feedback (keeps data but anonymizes)
    await Feedback.updateMany({ userId: userId }, { $unset: { userId: "" } });

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
