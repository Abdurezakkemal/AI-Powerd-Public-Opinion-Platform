const Vote = require("../models/Vote");
const Comment = require("../models/Comment");
const Policy = require("../models/Policy");
const logger = require("../utils/logger");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

// Helper to get rating distribution from votes
const getRatingDistribution = (votes) => {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  votes.forEach((v) => dist[v.rating]++);
  return dist;
};

// Helper to get sentiment counts from comments
const getSentimentCounts = (comments) => {
  const counts = { positive: 0, negative: 0, neutral: 0 };
  comments.forEach((c) => {
    if (c.sentiment && c.sentiment.label) {
      counts[c.sentiment.label] = (counts[c.sentiment.label] || 0) + 1;
    }
  });
  return counts;
};

// Helper to get top keywords from comments
const getTopKeywords = (comments, limit = 10) => {
  const freq = {};
  comments.forEach((c) => {
    if (c.keywords && Array.isArray(c.keywords)) {
      c.keywords.forEach((kw) => {
        freq[kw] = (freq[kw] || 0) + 1;
      });
    }
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, count }));
};

// GET /analytics/:policyId
exports.getAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = await Policy.findById(policyId);
    if (!policy) {
      logger.warn(`Analytics requested for non-existent policy: ${policyId}`);
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    if (req.user.role !== "planner" && req.user.role !== "admin") {
      logger.warn(
        `Access denied to analytics for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Access denied. Only planners and admins can view analytics.",
        null,
        403,
      );
    }

    // Get all votes for rating distribution and totals
    const votes = await Vote.find({ policyId });
    const totalVotes = votes.length;
    const appVotes = votes.filter((v) => v.channel === "app").length;
    const smsVotes = votes.filter((v) => v.channel === "sms").length;
    const ratings = votes.map((v) => v.rating);
    const averageRating = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : 0;
    const ratingDistribution = getRatingDistribution(votes);

    // Get comments for sentiment and keywords
    const comments = await Comment.find({ policyId });
    const sentimentCounts = getSentimentCounts(comments);
    const topKeywords = getTopKeywords(comments);

    logger.info(
      `Analytics delivered for policy ${policyId} to user ${req.user.id}`,
    );
    return sendSuccess(
      res,
      {
        policyId: policy._id,
        title: policy.title,
        averageRating: Number(averageRating),
        ratingDistribution,
        sentimentCounts,
        topKeywords,
        totalVotes,
        appVotes,
        smsVotes,
      },
      "Analytics retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get analytics error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve analytics",
      null,
      500,
    );
  }
};

// GET /analytics/:policyId/export (CSV)
exports.exportAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = await Policy.findById(policyId);
    if (!policy) {
      logger.warn(`CSV export requested for non-existent policy: ${policyId}`);
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      logger.warn(
        `Access denied to CSV export for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    // Get all votes and populate user region for app votes
    const votes = await Vote.find({ policyId })
      .populate("userId", "region")
      .lean();

    let csv = "rating,channel,date,region\n";
    votes.forEach((v) => {
      const date = v.createdAt.toISOString().split("T")[0];
      let region = "";
      if (v.channel === "app" && v.userId) {
        region = v.userId.region || "";
      }
      csv += `${v.rating},${v.channel},${date},${region}\n`;
    });

    logger.info(
      `CSV exported for policy ${policyId} by user ${req.user.id} (${votes.length} rows)`,
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="policy-${policyId}-analytics.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Export analytics error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to export analytics",
      null,
      500,
    );
  }
};

// GET /analytics/:policyId/comments
exports.getComments = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { page = 1, limit = 20, sentiment } = req.query;
    const policy = await Policy.findById(policyId);
    if (!policy) {
      logger.warn(`Comments requested for non-existent policy: ${policyId}`);
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      logger.warn(
        `Access denied to comments for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    const filter = { policyId };
    if (sentiment) filter["sentiment.label"] = sentiment;
    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("comment sentiment keywords createdAt userId")
      .populate("userId", "email")
      .lean();

    const total = await Comment.countDocuments(filter);

    const formattedComments = comments.map((c) => ({
      id: c._id,
      text: c.comment,
      sentiment: c.sentiment?.label || null,
      confidence: c.sentiment?.confidence || null,
      keywords: c.keywords || [],
      createdAt: c.createdAt,
      userEmail: c.userId?.email || "anonymous",
    }));

    logger.info(
      `Comments retrieved for policy ${policyId} by user ${req.user.id} (page ${page}, total ${total})`,
    );
    return sendSuccess(
      res,
      { comments: formattedComments, total, page: Number(page) },
      "Comments retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Get comments error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve comments",
      null,
      500,
    );
  }
};

// GET /analytics/:policyId/geographic
exports.getGeographicAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = await Policy.findById(policyId);
    if (!policy) {
      logger.warn(
        `Geographic analytics requested for non-existent policy: ${policyId}`,
      );
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      logger.warn(
        `Access denied to geographic analytics for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    // Only consider app votes that have comments (same as original logic)
    const geographicData = await Comment.aggregate([
      { $match: { policyId: policy._id } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.region",
          totalVotes: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          positive: {
            $sum: { $cond: [{ $eq: ["$sentiment.label", "positive"] }, 1, 0] },
          },
          negative: {
            $sum: { $cond: [{ $eq: ["$sentiment.label", "negative"] }, 1, 0] },
          },
          neutral: {
            $sum: { $cond: [{ $eq: ["$sentiment.label", "neutral"] }, 1, 0] },
          },
        },
      },
      { $sort: { totalVotes: -1 } },
    ]);

    const result = geographicData.map((item) => ({
      region: item._id || "Unknown",
      totalVotes: item.totalVotes,
      averageRating: parseFloat(item.averageRating.toFixed(2)),
      sentimentCounts: {
        positive: item.positive,
        negative: item.negative,
        neutral: item.neutral,
      },
    }));

    logger.info(
      `Geographic analytics delivered for policy ${policyId} to user ${req.user.id} (${result.length} regions)`,
    );
    return sendSuccess(
      res,
      { policyId, regions: result },
      "Geographic analytics retrieved successfully",
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Geographic analytics error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve geographic analytics",
      null,
      500,
    );
  }
};

// GET /analytics/:policyId/trends?interval=day|week
exports.getTrends = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { interval = "day" } = req.query;
    const policy = await Policy.findById(policyId);
    if (!policy) {
      logger.warn(`Trends requested for non-existent policy: ${policyId}`);
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      logger.warn(
        `Access denied to trends for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    const dateFormat = interval === "week" ? "%Y-%W" : "%Y-%m-%d";

    // Get rating trends from Votes
    const voteTrends = await Vote.aggregate([
      { $match: { policyId: policy._id } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          total: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get sentiment trends from Comments
    const sentimentTrends = await Comment.aggregate([
      { $match: { policyId: policy._id } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          positive: {
            $sum: { $cond: [{ $eq: ["$sentiment.label", "positive"] }, 1, 0] },
          },
          negative: {
            $sum: { $cond: [{ $eq: ["$sentiment.label", "negative"] }, 1, 0] },
          },
          neutral: {
            $sum: { $cond: [{ $eq: ["$sentiment.label", "neutral"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge both results
    const merged = {};
    voteTrends.forEach((vt) => {
      merged[vt._id] = {
        date: vt._id,
        averageRating: parseFloat(vt.averageRating?.toFixed(2) || 0),
        total: vt.total,
        positive: 0,
        negative: 0,
        neutral: 0,
      };
    });
    sentimentTrends.forEach((st) => {
      if (merged[st._id]) {
        merged[st._id].positive = st.positive;
        merged[st._id].negative = st.negative;
        merged[st._id].neutral = st.neutral;
      } else {
        merged[st._id] = {
          date: st._id,
          averageRating: 0,
          total: 0,
          positive: st.positive,
          negative: st.negative,
          neutral: st.neutral,
        };
      }
    });

    const result = Object.values(merged).sort((a, b) =>
      a.date > b.date ? 1 : -1,
    );

    logger.info(
      `Trends retrieved for policy ${policyId} by user ${req.user.id} (interval ${interval}, ${result.length} points)`,
    );
    return sendSuccess(
      res,
      { policyId, interval, data: result },
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
