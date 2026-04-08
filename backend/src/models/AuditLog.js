const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userRole: {
    type: String,
    enum: ["citizen", "planner", "admin"],
    required: true,
  },
  action: { type: String, required: true },
  targetType: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: Object },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ userId: 1, timestamp: -1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);
