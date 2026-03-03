const Feedback = require("../models/Feedback");
const Policy = require("../models/Policy");

exports.submitFeedback = async (req, res) => {
  try {
    const { policyId, rating, comment } = req.body;

    // Basic validation
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

    // Check if user is verified (from auth middleware)
    if (!req.user.verified) {
      return res
        .status(403)
        .json({ message: "Please verify your phone first" });
    }

    // Check if policy exists and is active
    const policy = await Policy.findOne({ _id: policyId, status: "active" });
    if (!policy) {
      return res
        .status(404)
        .json({ message: "Policy not found or not active" });
    }

    // Check if user already voted on this policy
    const existing = await Feedback.findOne({ policyId, userId: req.user.id });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already voted on this policy" });
    }

    // Create feedback
    const feedback = new Feedback({
      policyId,
      userId: req.user.id,
      channel: "app",
      rating,
      comment: comment || "",
      processed: false,
    });

    await feedback.save();

    res.status(201).json({ message: "Feedback recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
