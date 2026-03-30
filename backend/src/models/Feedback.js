const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // app votes
  phoneHash: { type: String }, // SMS votes
  channel: { type: String, enum: ["app", "sms"], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 }, // only for app
  sentiment: {
    label: { type: String, enum: ["positive", "negative", "neutral"] },
    confidence: Number,
  },
  keywords: [{ type: String }],
  processed: { type: Boolean, default: false },
  retryCount: { type: Number, default: 0 }, // track AI retries
  status: {
    type: String,
    enum: ["processed", "pending review", "processing"],
    default: "processing",
  }, // status for AI processing
  createdAt: { type: Date, default: Date.now },
  nextRetry: { type: Date, default: null }, // timestamp when to retry
});

// Prevent duplicate votes
feedbackSchema.index(
  { policyId: 1, userId: 1 },
  { unique: true, sparse: true },
);
feedbackSchema.index(
  { policyId: 1, phoneHash: 1 },
  { unique: true, sparse: true },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
