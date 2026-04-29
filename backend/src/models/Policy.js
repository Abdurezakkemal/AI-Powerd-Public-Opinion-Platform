const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetRegions: [{ type: String }],
  policyCode: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["draft", "published", "active", "paused", "closed"],
    default: "draft",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Policy", policySchema);
