const Feedback = require("../models/Feedback");
const Policy = require("../models/Policy");

// Helper to aggregate rating distribution
const getRatingDistribution = (feedbackList) => {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackList.forEach((f) => dist[f.rating]++);
  return dist;
};

// Helper to aggregate sentiment counts
const getSentimentCounts = (feedbackList) => {
  const counts = { positive: 0, negative: 0, neutral: 0 };
  feedbackList.forEach((f) => {
    if (f.sentiment && f.sentiment.label) {
      counts[f.sentiment.label] = (counts[f.sentiment.label] || 0) + 1;
    }
  });
  return counts;
};

// Helper to aggregate top keywords
const getTopKeywords = (feedbackList, limit = 10) => {
  const freq = {};
  feedbackList.forEach((f) => {
    if (f.keywords && Array.isArray(f.keywords)) {
      f.keywords.forEach((kw) => {
        freq[kw] = (freq[kw] || 0) + 1;
      });
    }
  });
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, count }));
  return sorted;
};

// GET /analytics/:policyId
exports.getAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    // Only planners/admins can access analytics
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
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

    res.json({
      policyId: policy._id,
      title: policy.title,
      averageRating: Number(averageRating),
      ratingDistribution,
      sentimentCounts,
      topKeywords,
      totalVotes,
      appVotes,
      smsVotes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /analytics/:policyId/export
exports.exportAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;

    const policy = await Policy.findById(policyId);
    if (!policy) return res.status(404).json({ message: "Policy not found" });

    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const feedbacks = await Feedback.find({ policyId }).lean();

    // Create CSV header
    let csv = "rating,channel,date,region\n";

    feedbacks.forEach((f) => {
      const date = f.createdAt.toISOString().split("T")[0];
      // For app votes, region is in user; for SMS, region unknown – we could leave empty or derive from policy target? We'll leave empty.
      const region = f.channel === "app" ? f.userId?.region || "" : "";
      csv += `${f.rating},${f.channel},${date},${region}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="policy-${policyId}-analytics.csv"`,
    );
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /analytics/:policyId/comments
exports.getComments = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { page = 1, limit = 20, sentiment } = req.query;

    const policy = await Policy.findById(policyId);
    if (!policy) return res.status(404).json({ message: "Policy not found" });

    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const filter = { policyId, comment: { $ne: "" } };
    if (sentiment) {
      filter["sentiment.label"] = sentiment;
    }

    const comments = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("comment sentiment keywords createdAt")
      .lean();

    const total = await Feedback.countDocuments(filter);

    res.json({
      comments: comments.map((c) => ({
        id: c._id,
        text: c.comment,
        sentiment: c.sentiment?.label || null,
        confidence: c.sentiment?.confidence || null,
        keywords: c.keywords || [],
        createdAt: c.createdAt,
      })),
      total,
      page: Number(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /analytics/:policyId/geographic
exports.getGeographicAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;

    const policy = await Policy.findById(policyId);
    if (!policy) return res.status(404).json({ message: "Policy not found" });

    // Only planners/admins
    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Aggregate feedback by region (from user data)
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

    res.json({ policyId, regions: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /analytics/:policyId/trends?interval=day|week
exports.getTrends = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { interval = "day" } = req.query;

    const policy = await Policy.findById(policyId);
    if (!policy) return res.status(404).json({ message: "Policy not found" });

    if (req.user.role !== "planner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // MongoDB date grouping format
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

    res.json({ policyId, interval, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
