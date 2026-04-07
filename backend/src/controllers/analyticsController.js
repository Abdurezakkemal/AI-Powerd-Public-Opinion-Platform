const Feedback = require("../models/Feedback");
const Policy = require("../models/Policy");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

const getRatingDistribution = (feedbackList) => {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackList.forEach((f) => dist[f.rating]++);
  return dist;
};

const getSentimentCounts = (feedbackList) => {
  const counts = { positive: 0, negative: 0, neutral: 0 };
  feedbackList.forEach((f) => {
    if (f.sentiment && f.sentiment.label) {
      counts[f.sentiment.label] = (counts[f.sentiment.label] || 0) + 1;
    }
  });
  return counts;
};

const getTopKeywords = (feedbackList, limit = 10) => {
  const freq = {};
  feedbackList.forEach((f) => {
    if (f.keywords && Array.isArray(f.keywords)) {
      f.keywords.forEach((kw) => {
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
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }

    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Access denied. Only planners and admins can view analytics.",
        null,
        403,
      );
    }

    const feedbacks = await Feedback.find({ policyId });
    const totalVotes = feedbacks.length;
    const appVotes = feedbacks.filter((f) => f.channel === "app").length;
    const smsVotes = feedbacks.filter((f) => f.channel === "sms").length;
    const ratings = feedbacks.map((f) => f.rating);
    const averageRating = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : 0;
    const ratingDistribution = getRatingDistribution(feedbacks);
    const sentimentCounts = getSentimentCounts(feedbacks);
    const topKeywords = getTopKeywords(feedbacks);

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
    console.error("Get analytics error:", err);
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
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    // ✅ FIX: populate userId to get region for app votes
    const feedbacks = await Feedback.find({ policyId })
      .populate("userId", "region")
      .lean();

    let csv = "rating,channel,date,region\n";
    feedbacks.forEach((f) => {
      const date = f.createdAt.toISOString().split("T")[0];
      // For app votes: use populated user's region (if any)
      // For SMS votes: region stays empty
      const region = f.channel === "app" ? f.userId?.region || "" : "";
      csv += `${f.rating},${f.channel},${date},${region}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="policy-${policyId}-analytics.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    console.error("Export analytics error:", err);
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
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    const filter = { policyId, comment: { $ne: "" } };
    if (sentiment) filter["sentiment.label"] = sentiment;
    const comments = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("comment sentiment keywords createdAt")
      .lean();
    const total = await Feedback.countDocuments(filter);

    const formattedComments = comments.map((c) => ({
      id: c._id,
      text: c.comment,
      sentiment: c.sentiment?.label || null,
      confidence: c.sentiment?.confidence || null,
      keywords: c.keywords || [],
      createdAt: c.createdAt,
    }));

    return sendSuccess(
      res,
      { comments: formattedComments, total, page: Number(page) },
      "Comments retrieved successfully",
    );
  } catch (err) {
    console.error("Get comments error:", err);
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
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    const geographicData = await Feedback.aggregate([
      {
        $match: { policyId: policy._id, channel: "app", comment: { $ne: "" } },
      },
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

    return sendSuccess(
      res,
      { policyId, regions: result },
      "Geographic analytics retrieved successfully",
    );
  } catch (err) {
    console.error("Geographic analytics error:", err);
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
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    }
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return sendError(res, ErrorCodes.FORBIDDEN, "Access denied", null, 403);
    }

    const dateFormat = interval === "week" ? "%Y-%W" : "%Y-%m-%d";
    const trends = await Feedback.aggregate([
      { $match: { policyId: policy._id } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          total: { $sum: 1 },
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
      { $sort: { _id: 1 } },
    ]);

    const result = trends.map((item) => ({
      date: item._id,
      averageRating: parseFloat(item.averageRating.toFixed(2)),
      positive: item.positive,
      negative: item.negative,
      neutral: item.neutral,
      total: item.total,
    }));

    return sendSuccess(
      res,
      { policyId, interval, data: result },
      "Trends retrieved successfully",
    );
  } catch (err) {
    console.error("Trends error:", err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve trends",
      null,
      500,
    );
  }
};
