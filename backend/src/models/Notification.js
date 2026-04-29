const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userRole: {
    type: String,
    enum: ["citizen", "planner", "admin"],
    required: true,
  },
  type: {
    type: String,
    enum: ["POLICY_CLOSED", "POLICY_ACTIVATED", "POLICY_EXTENDED"],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    type: Object,
    default: {}, // will store policyId, avgRating, totalVotes, etc.
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
