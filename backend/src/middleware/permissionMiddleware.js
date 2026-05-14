const PolicyAssociate = require("../models/PolicyAssociate");
const Policy = require("../models/Policy");

const hasAssociatePermission = (requiredPermission) => {
  return async (req, res, next) => {
    const policyId =
      req.params.policyId || req.body.policyId || req.query.policyId;
    if (!policyId) return next();

    const policy = await Policy.findById(policyId).select("createdBy");
    if (!policy) return next();

    // Extract owner ID safely (handles both ObjectId and populated user)
    let ownerId;
    if (policy.createdBy && typeof policy.createdBy === "object") {
      ownerId = policy.createdBy._id
        ? policy.createdBy._id.toString()
        : policy.createdBy.toString();
    } else {
      ownerId = policy.createdBy ? policy.createdBy.toString() : null;
    }
    const userId = req.user.id.toString();

    if (ownerId === userId || req.user.role === "admin") {
      return next();
    }

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

    return res.status(403).json({
      status: "error",
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    });
  };
};

module.exports = { hasAssociatePermission };
