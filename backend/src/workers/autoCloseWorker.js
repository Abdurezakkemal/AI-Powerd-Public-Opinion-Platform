const cron = require("node-cron");
const Policy = require("../models/Policy");
const Vote = require("../models/Vote");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");

const autoClosePolicies = async () => {
  try {
    const now = new Date();
    const policiesToClose = await Policy.find({
      status: { $in: ["active", "paused"] },
      endDate: { $lt: now },
    });

    for (const policy of policiesToClose) {
      const oldStatus = policy.status;
      policy.status = "closed";
      await policy.save();

      // Audit log
      await createAuditLog({
        userId: policy.createdBy,
        userRole: "system",
        action: "AUTO_CLOSE_POLICY",
        targetType: "Policy",
        targetId: policy._id,
        details: {
          policyCode: policy.policyCode,
          title: policy.title,
          reason: "endDate passed",
          previousStatus: oldStatus,
        },
        req: null,
      });

      // Compute final statistics for notifications
      const allVotes = await Vote.find({ policyId: policy._id });
      const totalVotes = allVotes.length;
      const totalRating = allVotes.reduce((sum, v) => sum + v.rating, 0);
      const avgRating =
        totalVotes > 0 ? (totalRating / totalVotes).toFixed(2) : 0;

      // Notify all app users who voted on this policy (userId exists)
      const distinctUserIds = [
        ...new Set(allVotes.map((v) => v.userId).filter((id) => id)),
      ];
      for (const userId of distinctUserIds) {
        await Notification.create({
          userId,
          userRole: "citizen",
          type: "POLICY_CLOSED",
          title: "Policy Closed",
          message: `Policy "${policy.title}" has closed. Final average rating: ${avgRating} stars (${totalVotes} votes).`,
          data: {
            policyId: policy._id,
            policyCode: policy.policyCode,
            averageRating: avgRating,
            totalVotes,
          },
        });
      }

      // Also notify the policy owner (planner)
      await Notification.create({
        userId: policy.createdBy,
        userRole: "planner",
        type: "POLICY_CLOSED",
        title: "Policy Closed",
        message: `Your policy "${policy.title}" has been automatically closed. Final average rating: ${avgRating} stars (${totalVotes} votes).`,
        data: {
          policyId: policy._id,
          policyCode: policy.policyCode,
          averageRating: avgRating,
          totalVotes,
        },
      });

      logger.info(
        `Auto-closed policy ${policy._id} (${policy.policyCode}) - endDate ${policy.endDate.toISOString()} (notified ${distinctUserIds.length} citizens)`,
      );
    }
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Auto‑close error");
  }
};

const startAutoCloseWorker = () => {
  // Run every minute
  cron.schedule("* * * * *", autoClosePolicies);
  logger.info("Auto‑close worker started (cron every minute)");
};

module.exports = { startAutoCloseWorker };
