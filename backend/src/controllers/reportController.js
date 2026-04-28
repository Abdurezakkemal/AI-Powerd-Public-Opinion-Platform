const User = require("../models/User");
const Vote = require("../models/Vote");
const Comment = require("../models/Comment");
const Policy = require("../models/Policy");
const AuditLog = require("../models/AuditLog");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");
const logger = require("../utils/logger");
const axios = require("axios");

// Helper to get AI service health
const getAIHealth = async () => {
  try {
    const response = await axios.get(
      `${process.env.AI_SERVICE_URL.replace("/analyze", "/health")}`,
      {
        timeout: 5000,
        headers: { "X-Internal-API-Key": process.env.INTERNAL_API_KEY },
      },
    );
    return response.data;
  } catch (err) {
    return { status: "unreachable", error: err.message };
  }
};

// GET /admin/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalCitizens,
      activeCitizens,
      verifiedCitizens,
      totalPlanners,
      activePlanners,
      totalPolicies,
      draftPolicies,
      activePolicies,
      closedPolicies,
      totalVotes,
      appVotes,
      smsVotes,
      totalComments,
      pendingComments,
      processedComments,
    ] = await Promise.all([
      User.countDocuments({ role: "citizen" }),
      User.countDocuments({ role: "citizen", active: true }),
      User.countDocuments({ role: "citizen", verified: true }),
      User.countDocuments({ role: "planner" }),
      User.countDocuments({ role: "planner", active: true }),
      Policy.countDocuments(),
      Policy.countDocuments({ status: "draft" }),
      Policy.countDocuments({ status: "active" }),
      Policy.countDocuments({ status: "closed" }),
      Vote.countDocuments(),
      Vote.countDocuments({ channel: "app" }),
      Vote.countDocuments({ channel: "sms" }),
      Comment.countDocuments(),
      Comment.countDocuments({ status: "pending review" }),
      Comment.countDocuments({ status: "processed" }),
    ]);

    // Calculate average rating across all votes
    const ratingAgg = await Vote.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);
    const avgRatingOverall = ratingAgg.length ? ratingAgg[0].avg : 0;

    // AI health
    const aiHealth = await getAIHealth();

    return sendSuccess(
      res,
      {
        users: {
          total: totalCitizens,
          active: activeCitizens,
          verified: verifiedCitizens,
        },
        planners: {
          total: totalPlanners,
          active: activePlanners,
        },
        policies: {
          total: totalPolicies,
          draft: draftPolicies,
          active: activePolicies,
          closed: closedPolicies,
        },
        votes: {
          total: totalVotes,
          app: appVotes,
          sms: smsVotes,
          averageRating: parseFloat(avgRatingOverall.toFixed(2)),
        },
        comments: {
          total: totalComments,
          pendingReview: pendingComments,
          processed: processedComments,
        },
        aiHealth,
      },
      "Dashboard statistics retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Dashboard stats error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve dashboard stats",
      null,
      500,
    );
  }
};

// GET /admin/trends?interval=day&days=30
exports.getTrends = async (req, res) => {
  try {
    const { interval = "day", days = 30 } = req.query;
    const daysInt = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    let groupFormat;
    if (interval === "week") groupFormat = "%Y-%U";
    else if (interval === "month") groupFormat = "%Y-%m";
    else groupFormat = "%Y-%m-%d";

    const votesTrend = await Vote.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const usersTrend = await User.aggregate([
      { $match: { role: "citizen", createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge into single array
    const trendMap = new Map();
    for (const v of votesTrend) {
      trendMap.set(v._id, {
        date: v._id,
        votes: v.count,
        avgRating: v.avgRating,
        newUsers: 0,
      });
    }
    for (const u of usersTrend) {
      if (trendMap.has(u._id)) {
        trendMap.get(u._id).newUsers = u.newUsers;
      } else {
        trendMap.set(u._id, {
          date: u._id,
          votes: 0,
          avgRating: 0,
          newUsers: u.newUsers,
        });
      }
    }

    const data = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return sendSuccess(
      res,
      { interval, data },
      "Trends retrieved successfully",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Trends error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve trends",
      null,
      500,
    );
  }
};

// GET /admin/audit-logs?page=1&limit=20&action=LOGIN&userId=...
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      userId,
      startDate,
      endDate,
    } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "email role"),
      AuditLog.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      {
        logs,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
      "Audit logs retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get audit logs error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve audit logs",
      null,
      500,
    );
  }
};

// GET /admin/audit-logs/export
exports.exportAuditLogs = async (req, res) => {
  try {
    const { action, userId, startDate, endDate } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .populate("userId", "email role")
      .lean();

    // Create CSV
    let csv =
      "timestamp,userEmail,userRole,action,targetType,targetId,details,ipAddress,userAgent\n";
    for (const log of logs) {
      const userEmail = log.userId?.email || "unknown";
      const userRole = log.userRole || log.userId?.role || "unknown";
      const details = JSON.stringify(log.details || {}).replace(/,/g, ";");
      csv += `"${log.timestamp}","${userEmail}","${userRole}","${log.action}","${log.targetType || ""}","${log.targetId || ""}","${details}","${log.ipAddress || ""}","${log.userAgent || ""}"\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-logs-${Date.now()}.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Export audit logs error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to export audit logs",
      null,
      500,
    );
  }
};

// GET /admin/ai/health
exports.getAIHealth = async (req, res) => {
  try {
    const health = await getAIHealth();
    // Also get pending comment count from our own DB
    const pendingComments = await Comment.countDocuments({
      status: "pending review",
    });
    const failedComments = await Comment.countDocuments({
      processed: false,
      retryCount: { $gte: 5 },
    });
    return sendSuccess(
      res,
      { ...health, pendingComments, failedComments },
      "AI service health retrieved",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "AI health error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve AI health",
      null,
      500,
    );
  }
};
