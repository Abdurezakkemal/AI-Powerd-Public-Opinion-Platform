const Policy = require("../models/Policy");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
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

const shouldHideFromPlanner = (policy, user) => {
  if (user.role === "admin") return false;
  if (user.role !== "planner") return false;
  const isOwner = policy.createdBy.toString() === user.id.toString();
  if (isOwner) return false;
  const isVisibleStatus = ["active", "paused", "closed"].includes(
    policy.status,
  );
  return !isVisibleStatus;
};

// GET /api/policies
exports.getAll = async (req, res) => {
  try {
    const {
      status,
      region,
      page = 1,
      limit = 20,
      owner,
      includeArchived,
      topic,
    } = req.query;
    const filter = {};

    // If a specific status is requested, apply it first (overrides later defaults)
    if (status) filter.status = status;

    // Role‑specific filters
    if (req.user.role === "citizen") {
      // Citizens see only active/paused policies in their region.
      const citizenStatuses = ["active", "paused"];
      filter.status =
        status && citizenStatuses.includes(status)
          ? status
          : { $in: citizenStatuses };
      filter.targetRegions = req.user.region;
    } else if (req.user.role === "planner") {
      // If owner=me, only policies created by this planner
      if (owner === "me") {
        filter.createdBy = new mongoose.Types.ObjectId(req.user.id);
      } else {
        filter.$or = [
          { createdBy: new mongoose.Types.ObjectId(req.user.id) },
          { status: { $in: ["active", "paused", "closed"] } },
        ];
      }
      // Unless a status is explicitly requested (e.g., ?status=archived), exclude archived policies
      if (!status && includeArchived !== "true") {
        filter.status = { $ne: "archived" };
      }
    } else if (req.user.role === "admin") {
      if (!status && includeArchived !== "true") {
        filter.status = { $ne: "archived" };
      }
      if (region) filter.targetRegions = region;
    }

    // If region was provided for planner (and not already handled)
    if (region && req.user.role !== "citizen" && req.user.role !== "admin") {
      filter.targetRegions = region;
    }

    // Topic filter (if provided)
    if (topic) {
      const topics = Array.isArray(topic) ? topic : [topic];
      filter.topics = { $in: topics };
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
      pollType: p.pollType,
      averageRating: 0,
      totalVotes: 0,
    }));

    logger.info(
      `User ${req.user.id} retrieved policies (page ${page}, total ${total})`,
    );
    return sendSuccess(
      res,
      { policies: formatted, total, page: Number(page) },
      "Policies retrieved",
    );
  } catch (err) {
    logger.error(`Get all policies error: ${err.message}`);
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
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    if (shouldHideFromPlanner(policy, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role === "citizen") {
      const allowedStatuses = ["active", "paused"];
      if (
        !allowedStatuses.includes(policy.status) ||
        !policy.targetRegions.includes(req.user.region)
      ) {
        return sendError(
          res,
          ErrorCodes.NOT_FOUND,
          "Policy not found",
          null,
          404,
        );
      }
    }
    const response = {
      id: policy._id,
      title: policy.title,
      description: policy.description,
      policyCode: policy.policyCode,
      targetRegions: policy.targetRegions,
      startDate: policy.startDate,
      endDate: policy.endDate,
      status: policy.status,
      pollType: policy.pollType,
      pollOptions: policy.pollOptions,
      maxSelections: policy.maxSelections,
      likertLabels: policy.likertLabels,
      rankedChoiceMaxRank: policy.rankedChoiceMaxRank,
      relevanceFactors: policy.relevanceFactors,
      citizenAnalyticsVisibility: policy.citizenAnalyticsVisibility,
      topics: policy.topics,
      createdBy: policy.createdBy.email,
      createdAt: policy.createdAt,
    };
    return sendSuccess(res, response, "Policy retrieved");
  } catch (err) {
    logger.error(`Get policy error: ${err.message}`);
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
    const {
      title,
      description,
      targetRegions,
      startDate,
      endDate,
      pollType = "rating",
      pollOptions = [],
      maxSelections = 1,
      likertLabels = [
        "Very Dissatisfied",
        "Dissatisfied",
        "Neutral",
        "Satisfied",
        "Very Satisfied",
      ],
      rankedChoiceMaxRank = 3,
      relevanceFactors = {},
      citizenAnalyticsVisibility = {},
      topics = [],
    } = req.body;

    if (!title || !description || !targetRegions || !startDate || !endDate) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Missing required fields",
        null,
        400,
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Normalize dates to midnight for fair comparison (ignore time component)
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (start < now)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Start date cannot be in the past",
        null,
        400,
      );
    if (start >= end)
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Start date must be before end date",
        null,
        400,
      );

    // Validate poll type
    const validPollTypes = [
      "binary",
      "multipleChoice",
      "likert",
      "approval",
      "rating",
      "rankedChoice",
    ];
    if (!validPollTypes.includes(pollType)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Invalid pollType",
        null,
        400,
      );
    }
    if (
      pollType === "multipleChoice" &&
      (!pollOptions.length || maxSelections < 1)
    ) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "multipleChoice requires pollOptions and maxSelections",
        null,
        400,
      );
    }
    if (
      pollType === "rankedChoice" &&
      (!pollOptions.length || rankedChoiceMaxRank < 1)
    ) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "rankedChoice requires pollOptions and maxRank",
        null,
        400,
      );
    }
    if (pollType === "likert" && likertLabels.length !== 5) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "likertLabels must have exactly 5 strings",
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
        return sendError(
          res,
          ErrorCodes.INTERNAL,
          "Unable to generate unique policy code",
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
      startDate: start,
      endDate: end,
      status: "draft",
      createdBy: req.user.id,
      pollType,
      pollOptions,
      maxSelections,
      likertLabels,
      rankedChoiceMaxRank,
      relevanceFactors,
      citizenAnalyticsVisibility,
      topics,
    });
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "CREATE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { title, policyCode, pollType },
      req,
    });

    logger.info(`User ${req.user.id} created policy ${policyCode}`);
    return sendSuccess(
      res,
      { id: policy._id, policyCode },
      "Policy created as draft.",
      201,
    );
  } catch (err) {
    logger.error(`Policy creation error: ${err.message}`);
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
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    if (shouldHideFromPlanner(policy, req.user)) {
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
        "Only draft policies can be edited",
        null,
        403,
      );
    }
    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      return sendError(res, ErrorCodes.FORBIDDEN, "No permission", null, 403);
    }

    const {
      title,
      description,
      targetRegions,
      startDate,
      endDate,
      pollType,
      pollOptions,
      maxSelections,
      likertLabels,
      rankedChoiceMaxRank,
      relevanceFactors,
      citizenAnalyticsVisibility,
      topics,
    } = req.body;
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
      policy.startDate = new Date(startDate);
      changes.startDate = startDate;
    }
    if (endDate) {
      policy.endDate = new Date(endDate);
      changes.endDate = endDate;
    }
    if (pollType) {
      policy.pollType = pollType;
      changes.pollType = pollType;
    }
    if (pollOptions) {
      policy.pollOptions = pollOptions;
      changes.pollOptions = pollOptions;
    }
    if (maxSelections) {
      policy.maxSelections = maxSelections;
      changes.maxSelections = maxSelections;
    }
    if (likertLabels) {
      policy.likertLabels = likertLabels;
      changes.likertLabels = likertLabels;
    }
    if (rankedChoiceMaxRank) {
      policy.rankedChoiceMaxRank = rankedChoiceMaxRank;
      changes.rankedChoiceMaxRank = rankedChoiceMaxRank;
    }
    if (relevanceFactors) {
      policy.relevanceFactors = relevanceFactors;
      changes.relevanceFactors = relevanceFactors;
    }
    if (citizenAnalyticsVisibility) {
      policy.citizenAnalyticsVisibility = citizenAnalyticsVisibility;
      changes.citizenAnalyticsVisibility = citizenAnalyticsVisibility;
    }
    if (topics) {
      policy.topics = topics;
      changes.topics = topics;
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
    logger.info(`User ${req.user.id} updated policy ${policy._id}`);
    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy updated",
    );
  } catch (err) {
    logger.error(`Update policy error: ${err.message}`);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update policy",
      null,
      500,
    );
  }
};
// PATCH /api/policies/:id/publish
exports.publish = async (req, res) => {
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

    if (shouldHideFromPlanner(policy, req.user)) {
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
        ErrorCodes.VALIDATION,
        `Only draft policies can be published. Current status: ${policy.status}`,
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
        "You do not have permission to publish this policy",
        null,
        403,
      );
    }

    const now = new Date();
    const start = new Date(policy.startDate);
    const end = new Date(policy.endDate);

    if (now > end) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Cannot publish a policy that has already ended.",
        null,
        400,
      );
    }

    let newStatus = "published";
    let action = "PUBLISH_POLICY";
    let message =
      "Policy published. It will be automatically activated on its start date.";

    if (now >= start && now <= end) {
      newStatus = "active";
      action = "ACTIVATE_POLICY";
      message =
        "Policy activated immediately because its start date has already passed.";
    }

    policy.status = newStatus;
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action,
      targetType: "Policy",
      targetId: policy._id,
      details: {
        policyCode: policy.policyCode,
        title: policy.title,
        fromStatus: "draft",
        toStatus: newStatus,
      },
      req,
    });

    logger.info(
      `Policy ${policy._id} (${policy.policyCode}) published by ${req.user.id} → status ${newStatus}`,
    );

    if (newStatus === "active") {
      await Notification.create({
        userId: policy.createdBy,
        userRole: "planner",
        type: "POLICY_ACTIVATED",
        title: "Policy Activated",
        message: `Your policy "${policy.title}" has been activated and is now accepting votes.`,
        data: { policyId: policy._id, policyCode: policy.policyCode },
      });
    }

    return sendSuccess(res, { id: policy._id, status: policy.status }, message);
  } catch (err) {
    logger.error(`Publish policy error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to publish policy",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/unpublish
exports.unpublish = async (req, res) => {
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

    if (shouldHideFromPlanner(policy, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    if (policy.status !== "published") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Only published policies can be unpublished. Current status: ${policy.status}`,
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
        "You do not have permission to unpublish this policy",
        null,
        403,
      );
    }

    policy.status = "draft";
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UNPUBLISH_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, title: policy.title },
      req,
    });

    logger.info(
      `Policy ${policy._id} (${policy.policyCode}) unpublished by ${req.user.id}`,
    );
    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy unpublished and moved back to draft.",
      200,
    );
  } catch (err) {
    logger.error(`Unpublish policy error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to unpublish policy",
      null,
      500,
    );
  }
};

// POST /api/policies/:id/close
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

    if (shouldHideFromPlanner(policy, req.user)) {
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

    // Notify associates with view_analytics permission
    const PolicyAssociate = require("../models/PolicyAssociate");
    const associates = await PolicyAssociate.find({
      policyId: policy._id,
      revokedAt: null,
      permissions: "view_analytics",
    }).select("plannerId");
    for (const associate of associates) {
      await createNotification({
        userId: associate.plannerId,
        type: "POLICY_CLOSED",
        title: "Policy Closed",
        message: `Policy "${policy.title}" has been manually closed.`,
        data: { policyId: policy._id, policyCode: policy.policyCode },
        severity: "info",
        source: "system",
      });
    }

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
    logger.error(`Close policy error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to close policy",
      null,
      500,
    );
  }
};
// PATCH /api/policies/:id/pause
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

    if (shouldHideFromPlanner(policy, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

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
    logger.error(`Pause error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to pause policy",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/resume
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

    if (shouldHideFromPlanner(policy, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

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
    logger.error(`Resume error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to resume policy",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/extend
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

    if (shouldHideFromPlanner(policy, req.user)) {
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

    // Notify all voters and associates (view_analytics)
    const Vote = require("../models/Vote");
    const PolicyAssociate = require("../models/PolicyAssociate");
    const voters = await Vote.find({
      policyId: policy._id,
      userId: { $ne: null },
    }).distinct("userId");
    const associates = await PolicyAssociate.find({
      policyId: policy._id,
      revokedAt: null,
      permissions: "view_analytics",
    }).select("plannerId");
    const userIds = [
      ...new Set([
        ...voters.map((v) => v.toString()),
        ...associates.map((a) => a.plannerId.toString()),
      ]),
    ];
    for (const uid of userIds) {
      await createNotification({
        userId: uid,
        type: "POLICY_EXTENDED",
        title: "Policy Extended",
        message: `Policy "${policy.title}" end date has been extended to ${newEndDate}.`,
        data: {
          policyId: policy._id,
          policyCode: policy.policyCode,
          newEndDate,
        },
        severity: "info",
        source: "system",
      });
    }

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
    logger.error(`Change end date error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to update end date",
      null,
      500,
    );
  }
};

// DELETE /api/policies/:id
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

    if (shouldHideFromPlanner(policy, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    if (policy.status !== "draft" && policy.status !== "published") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Only draft or published policies can be deleted. For active or paused policies, use the close endpoint.",
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
    logger.error(`Delete policy error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to delete policy",
      null,
      500,
    );
  }
};

// GET /api/policies/:id/history
exports.getHistory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Invalid policy ID format",
        null,
        404,
      );
    }
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

    if (shouldHideFromPlanner(policy, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    const userId = req.user.id.toString();
    const policyOwnerId = policy.createdBy.toString();
    if (req.user.role !== "admin" && userId !== policyOwnerId) {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "You do not have permission to view history of this policy",
        null,
        403,
      );
    }

    const events = await AuditLog.find({
      targetType: "Policy",
      targetId: policy._id,
    })
      .sort({ timestamp: 1 })
      .lean();

    const filtered = events.map((e) => ({
      action: e.action,
      userId: e.userId,
      userRole: e.userRole,
      details: e.details,
      timestamp: e.timestamp,
    }));

    logger.info(
      `User ${req.user.id} retrieved history for policy ${policy._id}`,
    );
    return sendSuccess(
      res,
      { events: filtered },
      "Policy history retrieved successfully",
    );
  } catch (err) {
    if (err.name === "CastError") {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Invalid policy ID format",
        null,
        404,
      );
    }
    logger.error(`Get policy history error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve policy history",
      null,
      500,
    );
  }
};

// POST /api/policies/:id/clone (copies all new fields)
exports.clone = async (req, res) => {
  try {
    const original = await Policy.findById(req.params.id);
    if (!original)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Original policy not found",
        null,
        404,
      );
    if (shouldHideFromPlanner(original, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    let newTitle = `${original.title} (Copy)`;
    if (newTitle.length > 200) newTitle = newTitle.substring(0, 197) + "...";

    let policyCode;
    let exists;
    let attempts = 0;
    do {
      policyCode = generatePolicyCode(newTitle);
      exists = await Policy.findOne({ policyCode });
      attempts++;
      if (attempts > 10) {
        return sendError(
          res,
          ErrorCodes.INTERNAL,
          "Unable to generate unique policy code",
          null,
          500,
        );
      }
    } while (exists);

    const newPolicy = new Policy({
      title: newTitle,
      description: original.description,
      targetRegions: original.targetRegions,
      policyCode,
      startDate: original.startDate,
      endDate: original.endDate,
      status: "draft",
      createdBy: req.user.id,
      pollType: original.pollType,
      pollOptions: original.pollOptions,
      maxSelections: original.maxSelections,
      likertLabels: original.likertLabels,
      rankedChoiceMaxRank: original.rankedChoiceMaxRank,
      relevanceFactors: original.relevanceFactors,
      citizenAnalyticsVisibility: original.citizenAnalyticsVisibility,
      topics: original.topics,
    });
    await newPolicy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "CLONE_POLICY",
      targetType: "Policy",
      targetId: newPolicy._id,
      details: { originalPolicyId: original._id },
      req,
    });
    logger.info(
      `User ${req.user.id} cloned policy ${original._id} to ${newPolicy._id}`,
    );
    return sendSuccess(
      res,
      { id: newPolicy._id, policyCode },
      "Policy cloned",
      201,
    );
  } catch (err) {
    logger.error(`Clone error: ${err.message}`);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to clone policy",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/archive
exports.archive = async (req, res) => {
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

    if (shouldHideFromPlanner(policy, req.user)) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    // NEW: block archiving draft policies
    if (policy.status === "draft") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Draft policies cannot be archived. You can delete them instead.",
        null,
        400,
      );
    }

    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();
    if (req.user.role !== "admin" && ownerId !== userId) {
      return sendError(res, ErrorCodes.FORBIDDEN, "No permission", null, 403);
    }

    if (policy.status === "archived") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Policy already archived",
        null,
        400,
      );
    }

    policy.status = "archived";
    policy.archivedAt = new Date();
    policy.archivedBy = req.user.id;
    policy.archivedByRole = req.user.role === "admin" ? "admin" : "planner";
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "ARCHIVE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, title: policy.title },
      req,
    });

    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy archived successfully",
    );
  } catch (err) {
    logger.error(`Archive error: ${err.message}`);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to archive policy",
      null,
      500,
    );
  }
};

// PATCH /api/policies/:id/restore
exports.restore = async (req, res) => {
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

    if (shouldHideFromPlanner(policy, req.user)) {
      // Hide archived from non‑owner planners; but we need to allow access for owner/admin.
      // We'll override below after checking permission.
    }

    if (policy.status !== "archived") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Only archived policies can be restored",
        null,
        400,
      );
    }

    // If archived by admin, only admin can restore
    if (policy.archivedByRole === "admin" && req.user.role !== "admin") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "This policy was archived by an admin and can only be restored by an admin.",
        null,
        403,
      );
    }

    // If archived by planner, allow owner or admin
    if (policy.archivedByRole === "planner") {
      const ownerId = policy.createdBy.toString();
      const userId = req.user.id.toString();
      if (req.user.role !== "admin" && ownerId !== userId) {
        return sendError(
          res,
          ErrorCodes.FORBIDDEN,
          "You do not have permission to restore this policy",
          null,
          403,
        );
      }
    }

    policy.status = "draft";
    policy.archivedAt = null;
    // Optionally keep archivedBy for audit, but clear role? Not needed.
    await policy.save();

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: "RESTORE_POLICY",
      targetType: "Policy",
      targetId: policy._id,
      details: { policyCode: policy.policyCode, title: policy.title },
      req,
    });

    return sendSuccess(
      res,
      { id: policy._id, status: policy.status },
      "Policy restored to draft",
    );
  } catch (err) {
    logger.error(`Restore policy error: ${err.message}`, { error: err });
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to restore policy",
      null,
      500,
    );
  }
};
