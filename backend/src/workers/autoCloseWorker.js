const Policy = require("../models/Policy");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");

const autoClosePolicies = async () => {
  try {
    const now = new Date();
    const policiesToClose = await Policy.find({
      status: "active",
      endDate: { $lt: now },
    });

    for (const policy of policiesToClose) {
      policy.status = "closed";
      await policy.save();

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
        },
        req: null,
      });
      logger.info(
        `Auto-closed policy ${policy._id} (${policy.policyCode}) - endDate ${policy.endDate.toISOString()}`,
      );
    }
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Auto‑close error");
  }
};

const startAutoCloseWorker = () => {
  setInterval(autoClosePolicies, 60 * 60 * 1000); // 5 seconds for testing, adjust to 1 hour for production
  logger.info("Auto‑close worker started ");
};

module.exports = { startAutoCloseWorker };
