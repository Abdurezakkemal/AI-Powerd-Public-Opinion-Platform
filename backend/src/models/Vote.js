const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  phoneHash: { type: String },
  channel: { type: String, enum: ["app", "sms"], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user (or phone) can only vote once per policy
voteSchema.index({ policyId: 1, userId: 1 }, { unique: true, sparse: true });
voteSchema.index({ policyId: 1, phoneHash: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Vote", voteSchema);
