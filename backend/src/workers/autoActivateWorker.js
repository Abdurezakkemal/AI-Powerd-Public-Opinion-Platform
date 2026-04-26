const Policy = require("../models/Policy");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");

const autoActivatePolicies = async () => {
  try {
    const now = new Date();
    const policiesToActivate = await Policy.find({
      status: "draft",
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    for (const policy of policiesToActivate) {
      policy.status = "active";
      await policy.save();

      await createAuditLog({
        userId: policy.createdBy,
        userRole: "system",
        action: "AUTO_ACTIVATE_POLICY",
        targetType: "Policy",
        targetId: policy._id,
        details: {
          policyCode: policy.policyCode,
          title: policy.title,
          reason: "startDate reached",
        },
        req: null,
      });
      logger.info(
        `Auto-activated policy ${policy._id} (${policy.policyCode}) - startDate ${policy.startDate.toISOString()}`,
      );
    }
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Auto‑activation error",
    );
  }
};

const startAutoActivateWorker = () => {
  setInterval(autoActivatePolicies, 60 * 60 * 1000); // 5 seconds for testing, adjust to 1 hour for production
  logger.info("Auto‑activation worker started ");
};

module.exports = { startAutoActivateWorker };
