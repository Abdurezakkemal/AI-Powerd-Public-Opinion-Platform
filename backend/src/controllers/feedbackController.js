const Feedback = require("../models/Feedback");
const Policy = require("../models/Policy");
const User = require("../models/User");

/**
 * Submit feedback for a policy
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { policyId, rating, comment } = req.body;

    // Validate required fields
    if (!policyId || !rating) {
      return res
        .status(400)
        .json({ message: "policyId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }
    if (comment && comment.length > 500) {
      return res
        .status(400)
        .json({ message: "Comment too long (max 500 chars)" });
    }

    // Fetch user from DB to ensure verified status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.verified) {
      return res
        .status(403)
        .json({ message: "Please verify your phone first" });
    }

    // Fetch policy and validate
    const policy = await Policy.findOne({ _id: policyId, status: "active" });
    if (!policy) {
      return res
        .status(404)
        .json({ message: "Policy not found or not active" });
    }

    const now = new Date();
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);
    if (now < start || now > end) {
      return res
        .status(400)
        .json({ message: "Voting not allowed for this policy at this time" });
    }

    // Check for duplicate feedback
    const existing = await Feedback.findOne({
      policyId,
      userId: user._id,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already voted on this policy" });
    }

    // Create feedback
    const feedback = new Feedback({
      policyId,
      userId: user._id,
      channel: "app",
      rating,
      comment: comment || "",
      processed: false,
      retryCount: 0, // for worker retry
    });

    await feedback.save();

    res.status(201).json({ message: "Feedback recorded", id: feedback._id });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already voted on this policy" });
    }
    console.error("Feedback submit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
