const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  voteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vote",
    required: true,
    unique: true, // one comment per vote
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true }, // duplicate rating for simplicity
  comment: { type: String, maxlength: 500, default: "" },
  sentiment: {
    label: {
      type: String,
      enum: ["positive", "negative", "neutral"],
      default: "neutral",
    },
    confidence: { type: Number, default: 0 },
  },
  keywords: { type: [String], default: [] },
  processed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["processing", "processed", "pending_review"],
    default: "processing",
  },
  retryCount: { type: Number, default: 0 },
  nextRetry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Unique index to enforce one comment per vote
commentSchema.index({ voteId: 1 }, { unique: true });
// Index for queries by policy and user (useful for analytics/admin)
commentSchema.index({ policyId: 1, userId: 1 });

module.exports = mongoose.model("Comment", commentSchema);
