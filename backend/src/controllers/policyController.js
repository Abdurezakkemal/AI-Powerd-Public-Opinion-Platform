const Policy = require("../models/Policy");
const { customAlphabet } = require("nanoid");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

const generatePolicyCode = (title) => {
  const prefix = title
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 4)
    .toUpperCase();
  const id = nanoid();
  return `${prefix}${id}`;
};

// GET /api/policies?status=&region=&page=1&limit=20
exports.getAll = async (req, res) => {
  try {
    const { status, region, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (req.user.role === "citizen") {
      filter.status = "active";
      filter.targetRegions = req.user.region;
    } else if (region) {
      filter.targetRegions = region;
    }

    const skip = (page - 1) * limit;
    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("createdBy", "email"),
      Policy.countDocuments(filter),
    ]);

    const formatted = policies.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      policyCode: p.policyCode,
      targetRegions: p.targetRegions,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      averageRating: 0,
      totalVotes: 0,
    }));

    logger.info(
      `User ${req.user.id} (${req.user.role}) retrieved policies (page ${page}, total ${total})`,
    );
    return sendSuccess(
      res,
      { policies: formatted, total, page: Number(page) },
      "Policies retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get all policies error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve policies",
      null,
      500,
    );
  }
};

// GET /api/policies/:id
exports.getOne = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id).populate(
      "createdBy",
      "email",
    );
    if (!policy) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    if (req.user.role === "citizen") {
      if (
        policy.status !== "active" ||
        !policy.targetRegions.includes(req.user.region)
      ) {
        return sendError(
          res,
          ErrorCodes.FORBIDDEN,
          "You do not have access to this policy",
          null,
          403,
        );
      }
    }

    logger.info(
      `User ${req.user.id} retrieved policy ${policy._id} (${policy.policyCode})`,
    );
    return sendSuccess(
      res,
      {
        id: policy._id,
        title: policy.title,
        description: policy.description,
        policyCode: policy.policyCode,
        targetRegions: policy.targetRegions,
        startDate: policy.startDate,
        endDate: policy.endDate,
        status: policy.status,
        createdBy: policy.createdBy.email,
        createdAt: policy.createdAt,
      },
      "Policy retrieved successfully",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Get policy error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve policy",
      null,
      500,
    );
  }
};

// POST /api/policies
exports.create = async (req, res) => {
  try {
    const { title, description, targetRegions, startDate, endDate } = req.body;
    if (!title || !description || !targetRegions || !startDate || !endDate) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "All fields are required: title, description, targetRegions, startDate, endDate",
        null,
        400,
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Start date must be before end date",
        null,
        400,
      );
    }

    let policyCode;
    let exists;
    let attempts = 0;
    do {
      policyCode = generatePolicyCode(title);
      exists = await Policy.findOne({ policyCode });
      attempts++;
      if (attempts > 10) {
        logger.error(
          `Failed to generate unique policy code for title: ${title}`,
        );
        return sendError(
          res,
          ErrorCodes.INTERNAL,
          "Unable to generate a unique policy code. Please try again.",
          null,
          500,
        );
      }
    } while (exists);

    const policy = new Policy({
      title,
      description,
      targetRegions,
      policyCode,
      startDate,
      endDate,
      status: "draft",
      createdBy: req.user.id,
    });
    await policy.save();

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "CREATE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { title, policyCode, targetRegions, startDate, endDate },
      req,
    });

    logger.info(`User ${req.user.id} created policy: ${title} (${policyCode})`);

    return sendSuccess(
      res,
      { id: policy._id, policyCode },
      "Policy created as draft. You can edit it before activating.",
      201,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Policy creation error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to create policy",
      null,
      500,
    );
  }
};

// PUT /api/policies/:id
exports.update = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (policy.status !== "draft") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only draft policies can be edited. Activate or close the policy to prevent further changes.",
        null,
        403,
      );
    }

    // Ownership check
    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      logger.warn(
        `User ${userId} attempted to edit policy ${policy._id} owned by ${ownerId}`,
      );
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission to edit this policy",
        null,
        403,
      );
    }

    const { title, description, targetRegions, startDate, endDate } = req.body;
    const changes = {};
    if (title) {
      policy.title = title;
      changes.title = title;
    }
    if (description) {
      policy.description = description;
      changes.description = description;
    }
    if (targetRegions) {
      policy.targetRegions = targetRegions;
      changes.targetRegions = targetRegions;
    }
    if (startDate) {
      policy.startDate = startDate;
      changes.startDate = startDate;
    }
    if (endDate) {
      policy.endDate = endDate;
      changes.endDate = endDate;
    }
    await policy.save();

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, changes },
      req,
    });

    logger.info(
      `User ${req.user.id} updated policy ${policy._id} (${policy.policyCode})`,
    );

    return sendSuccess(
      res,
      {
        id: policy._id,
        title: policy.title,
        description: policy.description,
        policyCode: policy.policyCode,
        targetRegions: policy.targetRegions,
        startDate: policy.startDate,
        endDate: policy.endDate,
        status: policy.status,
      },
      "Policy updated successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Policy update error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update policy",
      null,
      500,
    );
  }
};

// DELETE /api/policies/:id (also closes active policies)
exports.delete = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      logger.warn(
        `User ${userId} attempted to delete/close policy ${policy._id} owned by ${ownerId}`,
      );
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission to modify this policy",
        null,
        403,
      );
    }

    let action = "";
    let details = {};

    if (policy.status === "draft") {
      await policy.deleteOne();
      action = "DELETE_POLICY";
      details = { policyCode: policy.policyCode, title: policy.title };
      logger.info(
        `User ${req.user.id} deleted draft policy ${policy._id} (${policy.policyCode})`,
      );
      // Audit log
      await createAuditLog({
        userId: req.user.id,
        userRole: req.user.role,
        action,
        targetType: "Policy",
        targetId: policy._id,
        details,
        req,
      });
      return sendSuccess(res, null, "Policy deleted successfully");
    }

    if (policy.status === "active") {
      policy.status = "closed";
      await policy.save();
      action = "CLOSE_POLICY";
      details = { policyCode: policy.policyCode, title: policy.title };
      logger.info(
        `User ${req.user.id} closed active policy ${policy._id} (${policy.policyCode})`,
      );
      // Audit log
      await createAuditLog({
        userId: req.user.id,
        userRole: req.user.role,
        action,
        targetType: "Policy",
        targetId: policy._id,
        details,
        req,
      });
      return sendSuccess(
        res,
        { id: policy._id, status: policy.status },
        "Policy closed successfully. No more votes will be accepted.",
      );
    }

    return sendError(
      res,
      ErrorCodes.FORBIDDEN,
      "Policy is already closed and cannot be modified",
      null,
      400,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Policy delete/close error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to delete or close policy",
      null,
      500,
    );
  }
};
