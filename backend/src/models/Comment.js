const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  text: { type: String, required: true, maxlength: 2000 },

  language: { type: String, default: null },
  sentiment: {
    label: {
      type: String,
      enum: ["positive", "negative", "neutral"],
      default: null,
    },
    confidence: { type: Number, default: null },
  },
  keywords: { type: [String], default: [] },
  aiPrediction: { type: mongoose.Schema.Types.Mixed, default: null },

  visibility: { type: String, enum: ["visible", "hidden"], default: "visible" },
  hiddenReason: {
    type: String,
    enum: ["reports", "moderator", "profanity"],
    default: null,
  },

  moderationStatus: {
    type: String,
    enum: ["none", "pending_ai", "needs_review", "reviewed"],
    default: "pending_ai",
  },
  moderationReason: {
    type: String,
    enum: ["pending_ai", "low_confidence", "reports", "moderator_flag"],
    default: "pending_ai",
  },

  reportCount: { type: Number, default: 0 },
  reportedAt: { type: Date, default: null },

  flaggedSnapshot: {
    text: String,
    sentiment: { label: String, confidence: Number },
    keywords: [String],
    capturedAt: Date,
    reportCountAtCapture: Number,
  },

  appeal: {
    reason: String,
    status: {
      type: String,
      enum: ["pending", "resolved_approved", "resolved_rejected"],
    },
    createdAt: Date,
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolutionNote: String,
  },

  editedHistory: [
    {
      text: String,
      sentiment: { label: String, confidence: Number },
      keywords: [String],
      editedAt: Date,
    },
  ],

  retryCount: { type: Number, default: 0 },
  nextRetry: { type: Date, default: null },

  isOfficialReply: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Comment", commentSchema);
