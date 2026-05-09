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
    enum: [
      // Policy events
      "POLICY_ACTIVATED",
      "POLICY_CLOSED",
      "POLICY_EXTENDED",
      // Delegation
      "ASSOCIATE_ASSIGNED",
      // Messaging
      "MESSAGE_RECEIVED",
      // Comments
      "COMMENT_REPLY",
      "COMMENT_FLAGGED",
      "COMMENT_APPEAL",
      "APPEAL_RESOLVED",
      // Smart alerts
      "VOTE_SURGE",
      "RATING_DROP",
      "EMERGING_TOPIC",
      "PLANNER_APPROVED",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  severity: {
    type: String,
    enum: ["info", "warning", "critical"],
    default: "info",
  },
  source: { type: String, enum: ["system", "alert"], default: "system" },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
