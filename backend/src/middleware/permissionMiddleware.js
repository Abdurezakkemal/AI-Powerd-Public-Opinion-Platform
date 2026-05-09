const PolicyAssociate = require("../models/PolicyAssociate");
const Policy = require("../models/Policy");

// Check if user is an active associate with required permission for the policy
const hasAssociatePermission = (requiredPermission) => {
  return async (req, res, next) => {
    const policyId =
      req.params.policyId || req.body.policyId || req.query.policyId;
    if (!policyId) {
      return next(); // no policy context, skip
    }
    // If user is policy owner or admin, grant access
    const policy = await Policy.findById(policyId);
    if (
      policy &&
      (policy.createdBy.toString() === req.user.id || req.user.role === "admin")
    ) {
      return next();
    }
    // Check associate status
    const associate = await PolicyAssociate.findOne({
      policyId,
      plannerId: req.user.id,
      revokedAt: null,
      permissions: requiredPermission,
    });
    if (associate) {
      req.associate = associate;
      return next();
    }
    return res
      .status(403)
      .json({
        status: "error",
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
  };
};

module.exports = { hasAssociatePermission };
