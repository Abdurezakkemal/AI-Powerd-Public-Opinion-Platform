const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  region: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  phoneHash: { type: String },
  channel: { type: String, enum: ["app", "sms"], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Partial unique index for app votes (only when userId is an ObjectId, i.e., not null)
voteSchema.index(
  { policyId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } },
);

// Partial unique index for SMS votes (only when phoneHash is a string, i.e., not null)
voteSchema.index(
  { policyId: 1, phoneHash: 1 },
  { unique: true, partialFilterExpression: { phoneHash: { $type: "string" } } },
);

// Optional: index for date queries
voteSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Vote", voteSchema);
