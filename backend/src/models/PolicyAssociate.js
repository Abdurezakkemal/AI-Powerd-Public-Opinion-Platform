const mongoose = require("mongoose");

const policyAssociateSchema = new mongoose.Schema({
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  plannerId: {
    // the associate (must have role = "planner")
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  permissions: {
    type: [String],
    enum: [
      "view_analytics",
      "moderate_comments",
      "reply_official",
      "export_data",
    ],
    required: true,
  },
  assignedBy: {
    // the policy owner (planner or admin)
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
});

module.exports = mongoose.model("PolicyAssociate", policyAssociateSchema);
