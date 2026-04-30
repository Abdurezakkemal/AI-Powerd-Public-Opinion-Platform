const mongoose = require("mongoose");
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

// Helper to validate date parameters
const validateDateParam = (dateStr, paramName) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ${paramName}: ${dateStr}`);
  }
  return date;
};

// Helper to check if user can view policy analytics
// Returns: { allowed: boolean, errorCode?: string, errorMessage?: string, statusCode?: number }
const checkPolicyAnalyticsAccess = (policy, user) => {
  // Admin always gets access (but will be handled by status check later)
  if (user.role === "admin") {
    return { allowed: true };
  }

  // Only planners can view analytics (citizens cannot)
  if (user.role !== "planner") {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage:
        "Access denied. Only planners and admins can view analytics.",
      statusCode: 403,
    };
  }

  // For draft/published policies
  if (policy.status === "draft" || policy.status === "published") {
    // Creator gets a validation error (policy not active yet)
    if (policy.createdBy.toString() === user.id.toString()) {
      return {
        allowed: false,
        errorCode: "VALIDATION_ERROR",
        errorMessage: "Policy is not active yet (no analytics available)",
        statusCode: 400,
      };
    }
    // Other planners get 404 (policy hidden)
    return {
      allowed: false,
      errorCode: "NOT_FOUND",
      errorMessage: "Policy not found",
      statusCode: 404,
    };
  }

  // For active/paused/closed policies: any planner can view
  return { allowed: true };
};

// GET /analytics/:policyId
exports.getAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { startDate, endDate } = req.query;

    let start, end;
    try {
      start = validateDateParam(startDate, "startDate");
      end = validateDateParam(endDate, "endDate");
    } catch (err) {
      return sendError(res, ErrorCodes.VALIDATION, err.message, null, 400);
    }

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

    // Check permission
    const { allowed, errorCode, errorMessage, statusCode } =
      checkPolicyAnalyticsAccess(policy, req.user);
    if (!allowed) {
      logger.warn(
        `Access denied to analytics for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(res, errorCode, errorMessage, null, statusCode);
    }

    // Build date filters for votes and comments
    const voteFilter = { policyId };
    const commentFilter = { policyId };
    if (start) voteFilter.createdAt = { $gte: start };
    if (end) voteFilter.createdAt = { ...voteFilter.createdAt, $lte: end };
    if (start) commentFilter.createdAt = { $gte: start };
    if (end)
      commentFilter.createdAt = { ...commentFilter.createdAt, $lte: end };

    const votes = await Vote.find(voteFilter);
    const totalVotes = votes.length;
    const appVotes = votes.filter((v) => v.channel === "app").length;
    const smsVotes = votes.filter((v) => v.channel === "sms").length;
    const ratings = votes.map((v) => v.rating);
    const averageRating = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : 0;
    const ratingDistribution = getRatingDistribution(votes);

    const comments = await Comment.find(commentFilter);
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
    const { startDate, endDate } = req.query;

    let start, end;
    try {
      start = validateDateParam(startDate, "startDate");
      end = validateDateParam(endDate, "endDate");
    } catch (err) {
      return sendError(res, ErrorCodes.VALIDATION, err.message, null, 400);
    }

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

    // Check permission
    const { allowed, errorCode, errorMessage, statusCode } =
      checkPolicyAnalyticsAccess(policy, req.user);
    if (!allowed) {
      logger.warn(
        `Access denied to CSV export for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(res, errorCode, errorMessage, null, statusCode);
    }

    const voteFilter = { policyId };
    if (start) voteFilter.createdAt = { $gte: start };
    if (end) voteFilter.createdAt = { ...voteFilter.createdAt, $lte: end };

    const votes = await Vote.find(voteFilter)
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
    const { page = 1, limit = 20, sentiment, startDate, endDate } = req.query;

    let start, end;
    try {
      start = validateDateParam(startDate, "startDate");
      end = validateDateParam(endDate, "endDate");
    } catch (err) {
      return sendError(res, ErrorCodes.VALIDATION, err.message, null, 400);
    }

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

    // Check permission
    const { allowed, errorCode, errorMessage, statusCode } =
      checkPolicyAnalyticsAccess(policy, req.user);
    if (!allowed) {
      logger.warn(
        `Access denied to comments for policy ${policyId} by user ${req.user.id}`,
      );
      return sendError(res, errorCode, errorMessage, null, statusCode);
    }

    const filter = { policyId };
    if (sentiment) filter["sentiment.label"] = sentiment;
    if (start) filter.createdAt = { $gte: start };
    if (end) filter.createdAt = { ...filter.createdAt, $lte: end };

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

// GET /analytics/heatmap
exports.getHeatmap = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      interval = "week",
      policyId,
      byRegion = "false",
      regions,
    } = req.query;
    const byRegionFlag = byRegion === "true";

    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Access denied. Only planners and admins can view heatmap.",
        null,
        403,
      );
    }

    // -------- 1. Validate and parse date parameters ----------
    const parseDate = (dateStr, paramName) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        throw new Error(`Invalid ${paramName}: ${dateStr}`);
      }
      return d;
    };

    let start, end;
    try {
      start = parseDate(startDate, "startDate");
      end = parseDate(endDate, "endDate");
    } catch (err) {
      return sendError(res, ErrorCodes.VALIDATION, err.message, null, 400);
    }

    // -------- 2. Validate policyId and check access ----------
    let policy = null;
    if (policyId) {
      if (!mongoose.Types.ObjectId.isValid(policyId)) {
        return sendError(
          res,
          ErrorCodes.VALIDATION,
          "Invalid policyId format",
          null,
          400,
        );
      }
      policy = await Policy.findById(policyId);
      if (!policy) {
        return sendError(
          res,
          ErrorCodes.NOT_FOUND,
          "Policy not found",
          null,
          404,
        );
      }

      const access = checkPolicyAnalyticsAccess(policy, req.user);
      console.log("access object:", access);
      const { allowed, errorCode, errorMessage, statusCode } =
        checkPolicyAnalyticsAccess(policy, req.user);
      if (!allowed) {
        return sendError(res, errorCode, errorMessage, null, statusCode);
      }
    }

    // -------- 3. Build vote match (app votes with region) ----------
    const voteMatch = { channel: "app", region: { $ne: null } };
    if (policyId) voteMatch.policyId = new mongoose.Types.ObjectId(policyId);
    if (start) voteMatch.createdAt = { $gte: start };
    if (end) voteMatch.createdAt = { ...voteMatch.createdAt, $lte: end };
    if (regions) {
      const regionList = regions.split(",").map((r) => r.trim());
      voteMatch.region = { $in: regionList };
    }

    // -------- 4. Build comment match (for sentiment) ----------
    const commentMatch = {};
    if (policyId) commentMatch.policyId = new mongoose.Types.ObjectId(policyId);
    if (start) commentMatch.createdAt = { $gte: start };
    if (end) commentMatch.createdAt = { ...commentMatch.createdAt, $lte: end };
    // Note: comments themselves do not have a region field; we will join with votes later

    // -------- 5. Date format based on interval ----------
    let dateFormat;
    switch (interval) {
      case "day":
        dateFormat = "%Y-%m-%d";
        break;
      case "week":
        dateFormat = "%Y-%V";
        break; // ISO week number
      case "month":
        dateFormat = "%Y-%m";
        break;
      default:
        dateFormat = "%Y-%V";
    }

    let results;

    if (byRegionFlag) {
      // -------- 5a. Vote aggregation (time + region) ----------
      const voteAgg = await Vote.aggregate([
        { $match: voteMatch },
        {
          $group: {
            _id: {
              period: {
                $dateToString: { format: dateFormat, date: "$createdAt" },
              },
              region: "$region",
            },
            totalVotes: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
        { $sort: { "_id.period": 1, "_id.region": 1 } },
      ]);

      // -------- 5b. Sentiment aggregation (comments → votes) ----------
      // First, build the pipeline steps
      const sentimentPipeline = [
        { $match: commentMatch },
        {
          $lookup: {
            from: "votes",
            localField: "voteId",
            foreignField: "_id",
            as: "vote",
          },
        },
        { $unwind: "$vote" },
        // Only keep comments whose vote has a region (app votes)
        { $match: { "vote.region": { $ne: null } } },
      ];
      // Apply region filter if provided (to sentiment aggregation as well)
      if (regions) {
        const regionList = regions.split(",").map((r) => r.trim());
        sentimentPipeline.push({
          $match: { "vote.region": { $in: regionList } },
        });
      }
      sentimentPipeline.push(
        {
          $group: {
            _id: {
              period: {
                $dateToString: { format: dateFormat, date: "$createdAt" },
              },
              region: "$vote.region",
            },
            positive: {
              $sum: {
                $cond: [{ $eq: ["$sentiment.label", "positive"] }, 1, 0],
              },
            },
            negative: {
              $sum: {
                $cond: [{ $eq: ["$sentiment.label", "negative"] }, 1, 0],
              },
            },
            neutral: {
              $sum: { $cond: [{ $eq: ["$sentiment.label", "neutral"] }, 1, 0] },
            },
          },
        },
        { $sort: { "_id.period": 1, "_id.region": 1 } },
      );

      const sentimentAgg = await Comment.aggregate(sentimentPipeline);

      // -------- 5c. Merge voteAgg and sentimentAgg ----------
      const periodsMap = new Map();
      voteAgg.forEach((v) => {
        const period = v._id.period;
        const region = v._id.region;
        if (!periodsMap.has(period)) periodsMap.set(period, new Map());
        const regionMap = periodsMap.get(period);
        regionMap.set(region, {
          totalVotes: v.totalVotes,
          averageRating: parseFloat(v.averageRating.toFixed(2)),
          sentiment: { positive: 0, negative: 0, neutral: 0 },
        });
      });
      sentimentAgg.forEach((c) => {
        const period = c._id.period;
        const region = c._id.region;
        if (!periodsMap.has(period)) periodsMap.set(period, new Map());
        const regionMap = periodsMap.get(period);
        if (!regionMap.has(region)) {
          regionMap.set(region, {
            totalVotes: 0,
            averageRating: 0,
            sentiment: { positive: 0, negative: 0, neutral: 0 },
          });
        }
        const data = regionMap.get(region);
        data.sentiment.positive += c.positive;
        data.sentiment.negative += c.negative;
        data.sentiment.neutral += c.neutral;
      });

      // Build final response array
      const periods = Array.from(periodsMap.keys()).sort();
      results = periods.map((period) => {
        const regionMap = periodsMap.get(period);
        const regionsArr = Array.from(regionMap.entries()).map(
          ([region, data]) => ({
            region,
            totalVotes: data.totalVotes,
            averageRating: data.averageRating,
            sentimentCounts: data.sentiment,
          }),
        );
        // human‑readable date range (optional)
        let startDateStr = "",
          endDateStr = "";
        if (interval === "day") {
          startDateStr = period;
        } else if (interval === "week") {
          const [year, week] = period.split("-");
          const firstDay = new Date(year, 0, 1 + (week - 1) * 7);
          startDateStr = firstDay.toISOString().split("T")[0];
          const lastDay = new Date(
            firstDay.getTime() + 6 * 24 * 60 * 60 * 1000,
          );
          endDateStr = lastDay.toISOString().split("T")[0];
        } else if (interval === "month") {
          startDateStr = period + "-01";
          const lastDay = new Date(
            new Date(period + "-01").getFullYear(),
            new Date(period + "-01").getMonth() + 1,
            0,
          );
          endDateStr = lastDay.toISOString().split("T")[0];
        }
        return {
          period,
          startDate: startDateStr,
          endDate: endDateStr,
          regions: regionsArr,
        };
      });
    } else {
      // -------- Without region grouping (global time series) ----------
      const voteAgg = await Vote.aggregate([
        { $match: voteMatch },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            totalVotes: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // For global sentiment, we still need to join comments with votes to get region? Actually global sentiment counts should be per period, not per region. The existing code uses commentMatch without region, which is fine because comments are linked to votes, but we only care about sentiment totals overall. However, we must still filter by date and policy. The commentMatch already includes date and policy. No need to join with votes for global sentiment because the comment has its own createdAt and sentiment. So we can simply aggregate comments directly.

      const sentimentAgg = await Comment.aggregate([
        { $match: commentMatch },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            positive: {
              $sum: {
                $cond: [{ $eq: ["$sentiment.label", "positive"] }, 1, 0],
              },
            },
            negative: {
              $sum: {
                $cond: [{ $eq: ["$sentiment.label", "negative"] }, 1, 0],
              },
            },
            neutral: {
              $sum: { $cond: [{ $eq: ["$sentiment.label", "neutral"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const merged = new Map();
      voteAgg.forEach((v) => {
        merged.set(v._id, {
          period: v._id,
          totalVotes: v.totalVotes,
          averageRating: parseFloat(v.averageRating?.toFixed(2) || 0),
          positive: 0,
          negative: 0,
          neutral: 0,
        });
      });
      sentimentAgg.forEach((s) => {
        if (!merged.has(s._id)) {
          merged.set(s._id, {
            period: s._id,
            totalVotes: 0,
            averageRating: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
          });
        }
        const data = merged.get(s._id);
        data.positive += s.positive;
        data.negative += s.negative;
        data.neutral += s.neutral;
      });

      results = Array.from(merged.values()).sort((a, b) =>
        a.period > b.period ? 1 : -1,
      );
    }

    logger.info(
      `Heatmap data generated by user ${req.user.id} (${results.length} periods)`,
    );
    return sendSuccess(
      res,
      { interval, data: results },
      "Heatmap data retrieved successfully",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Heatmap error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve heatmap data",
      null,
      500,
    );
  }
};
