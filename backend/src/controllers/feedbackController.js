const Feedback = require("../models/Feedback");
const Policy = require("../models/Policy");

exports.submitFeedback = async (req, res) => {
  try {
    const { policyId, rating, comment } = req.body;

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

    if (!req.user.verified) {
      return res
        .status(403)
        .json({ message: "Please verify your phone first" });
    }

    const policy = await Policy.findOne({ _id: policyId, status: "active" });
    if (!policy) {
      return res
        .status(404)
        .json({ message: "Policy not found or not active" });
    }

    // Validate voting period
    const now = new Date();
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);
    if (now < start || now > end) {
      return res
        .status(400)
        .json({ message: "Voting not allowed for this policy at this time" });
    }

    // Check for duplicate
    const existing = await Feedback.findOne({ policyId, userId: req.user.id });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already voted on this policy" });
    }

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
    // Handle duplicate key error from unique index
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already voted on this policy" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
