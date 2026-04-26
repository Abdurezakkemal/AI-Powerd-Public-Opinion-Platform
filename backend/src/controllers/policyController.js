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
    const now = new Date();

    if (start < now) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Start date cannot be in the past. Please set a future start date.",
        null,
        400,
      );
    }
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
    const now = new Date();

    // Update simple fields
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

    // Update startDate with validations
    if (startDate !== undefined) {
      const newStart = new Date(startDate);
      if (newStart < now) {
        return sendError(
          res,
          ErrorCodes.VALIDATION,
          "Start date cannot be in the past.",
          null,
          400,
        );
      }
      // If endDate is also being updated in this request, we need to validate against the new endDate.
      // We'll handle that after we have the final endDate value.
      // For now, store the tentative start; final check will be done after processing endDate.
      policy.startDate = newStart;
      changes.startDate = newStart;
    }

    // Update endDate with validations
    if (endDate !== undefined) {
      const newEnd = new Date(endDate);
      // Use the (possibly updated) startDate for comparison
      const effectiveStart = startDate ? new Date(startDate) : policy.startDate;
      if (newEnd <= effectiveStart) {
        return sendError(
          res,
          ErrorCodes.VALIDATION,
          "End date must be after start date.",
          null,
          400,
        );
      }
      policy.endDate = newEnd;
      changes.endDate = newEnd;
    } else if (startDate !== undefined) {
      // Only startDate was updated, need to ensure it is before existing endDate
      const newStart = new Date(startDate);
      if (newStart >= policy.endDate) {
        return sendError(
          res,
          ErrorCodes.VALIDATION,
          "Start date must be before end date.",
          null,
          400,
        );
      }
    }

    // Additional check if both were provided (redundant but safe)
    if (startDate !== undefined && endDate !== undefined) {
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      if (newStart >= newEnd) {
        return sendError(
          res,
          ErrorCodes.VALIDATION,
          "Start date must be before end date.",
          null,
          400,
        );
      }
    }

    await policy.save();

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

// ==================== POLICY LIFECYCLE METHODS ====================

// PATCH /api/policies/:id/activate (draft -> active, only if within date window)
exports.activate = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    if (policy.status !== "draft") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only draft policies can be activated. Current: ${policy.status}`,
        null,
        400,
      );
    }

    const now = new Date();
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);
    if (now < start || now > end) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Cannot activate policy outside its voting window (${start.toISOString()} to ${end.toISOString()})`,
        null,
        400,
      );
    }

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      logger.warn(
        `User ${userId} attempted to activate policy ${policy._id} owned by ${ownerId}`,
      );
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission to activate this policy",
        null,
        403,
      );
    }

    policy.status = "active";
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "ACTIVATE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, title: policy.title },
      req,
    });
    logger.info(
      `Policy ${policy._id} (${policy.policyCode}) activated by ${req.user.id}`,
    );
    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy activated successfully. Voting is now open (within date range).",
      200,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Policy activation error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to activate policy",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/extend (change endDate for active or paused policies)
exports.extendEndDate = async (req, res) => {
  try {
    const { newEndDate } = req.body;
    if (!newEndDate)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "newEndDate is required",
        null,
        400,
      );

    const policy = await Policy.findById(req.params.id);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );

    if (!["active", "paused"].includes(policy.status)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only active or paused policies can change end date. Current: ${policy.status}`,
        null,
        400,
      );
    }

    const start = new Date(policy.startDate);
    const newEnd = new Date(newEndDate);
    const now = new Date();
    const currentEnd = new Date(policy.endDate);

    if (isNaN(newEnd.getTime()))
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Invalid date format",
        null,
        400,
      );
    if (newEnd <= start)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "New end date must be after start date",
        null,
        400,
      );
    if (policy.status === "active" && newEnd <= now)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "New end date must be after current date for active policy",
        null,
        400,
      );
    if (newEnd.getTime() === currentEnd.getTime())
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "New end date is same as current",
        null,
        400,
      );

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission",
        null,
        403,
      );
    }

    const oldEndDate = policy.endDate;
    policy.endDate = newEnd;
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE_POLICY_END_DATE",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, oldEndDate, newEndDate },
      req,
    });
    logger.info(
      `Policy ${policy._id} end date changed from ${oldEndDate} to ${newEndDate} by ${req.user.id}`,
    );
    return sendSuccess(
      res,
      { id: policy._id, endDate: policy.endDate },
      "Policy end date updated successfully",
      200,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Change end date error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update end date",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/pause (active -> paused)
exports.pause = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    if (policy.status !== "active")
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only active policies can be paused. Current: ${policy.status}`,
        null,
        400,
      );

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission",
        null,
        403,
      );
    }

    policy.status = "paused";
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "PAUSE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, title: policy.title },
      req,
    });
    logger.info(`Policy ${policy._id} paused by ${req.user.id}`);
    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy paused. Voting disabled.",
      200,
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Pause error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to pause policy",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/resume (paused -> active, must still be within date range)
exports.resume = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    if (policy.status !== "paused")
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only paused policies can be resumed. Current: ${policy.status}`,
        null,
        400,
      );

    const now = new Date();
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);
    if (now < start || now > end) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Cannot resume policy outside its voting window. Consider extending end date first.",
        null,
        400,
      );
    }

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission",
        null,
        403,
      );
    }

    policy.status = "active";
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RESUME_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, title: policy.title },
      req,
    });
    logger.info(`Policy ${policy._id} resumed by ${req.user.id}`);
    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy resumed. Voting enabled.",
      200,
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Resume error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to resume policy",
      null,
      500,
    );
  }
};

// POST /api/policies/:id/close (active or paused -> closed)
exports.close = async (req, res) => {
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

    if (!["active", "paused"].includes(policy.status)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only active or paused policies can be closed. Current status: ${policy.status}`,
        null,
        400,
      );
    }

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      logger.warn(
        `User ${userId} attempted to close policy ${policy._id} not owned`,
      );
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission to close this policy",
        null,
        403,
      );
    }

    policy.status = "closed";
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "CLOSE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: {
        policyCode: policy.policyCode,
        title: policy.title,
        previousStatus: policy.status,
      },
      req,
    });

    logger.info(
      `Policy ${policy._id} (${policy.policyCode}) closed by ${req.user.id}`,
    );
    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy closed successfully. No more votes will be accepted.",
      200,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Close policy error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to close policy",
      null,
      500,
    );
  }
};
// DELETE /api/policies/:id (only for draft policies)
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

    if (policy.status !== "draft") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only draft policies can be deleted. For active or paused policies, use the close endpoint.",
        null,
        403,
      );
    }

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      logger.warn(
        `User ${userId} attempted to delete policy ${policy._id} not owned`,
      );
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission to delete this policy",
        null,
        403,
      );
    }

    await policy.deleteOne();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "DELETE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, title: policy.title },
      req,
    });

    logger.info(
      `Policy ${policy._id} (${policy.policyCode}) deleted by ${req.user.id}`,
    );
    return sendSuccess(res, null, "Policy deleted successfully", 200);
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Delete policy error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to delete policy",
      null,
      500,
    );
  }
};
