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

// ---------- Helper: poll‑type aggregation ----------
const getPollTypeAggregation = async (policy, voteFilter) => {
  const votes = await Vote.find(voteFilter);
  const totalVotes = votes.length;

  switch (policy.pollType) {
    case "binary": {
      const yesCount = votes.filter((v) => v.value === "yes").length;
      const noCount = totalVotes - yesCount;
      return {
        totalVotes,
        yesCount,
        noCount,
        yesPercentage: totalVotes
          ? ((yesCount / totalVotes) * 100).toFixed(1)
          : 0,
        noPercentage: totalVotes
          ? ((noCount / totalVotes) * 100).toFixed(1)
          : 0,
      };
    }
    case "multipleChoice": {
      const optionCounts = {};
      policy.pollOptions.forEach((opt) => {
        optionCounts[opt.id] = 0;
      });
      votes.forEach((v) => {
        if (Array.isArray(v.value)) {
          v.value.forEach((optId) => {
            if (optionCounts[optId] !== undefined) optionCounts[optId]++;
          });
        }
      });
      const results = policy.pollOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        count: optionCounts[opt.id],
        percentage: totalVotes
          ? ((optionCounts[opt.id] / totalVotes) * 100).toFixed(1)
          : 0,
      }));
      return { totalVotes, results };
    }
    case "likert":
    case "rating": {
      const values = votes.map((v) => v.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = totalVotes ? (sum / totalVotes).toFixed(2) : 0;
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      values.forEach((v) => {
        distribution[v] = (distribution[v] || 0) + 1;
      });
      return { totalVotes, average: parseFloat(avg), distribution };
    }
    case "approval": {
      const approveCount = votes.filter((v) => v.value === "approve").length;
      const rejectCount = votes.filter((v) => v.value === "reject").length;
      const abstainCount = votes.filter((v) => v.value === "abstain").length;
      const netApproval = approveCount - rejectCount;
      return {
        totalVotes,
        approveCount,
        rejectCount,
        abstainCount,
        approvePercentage: totalVotes
          ? ((approveCount / totalVotes) * 100).toFixed(1)
          : 0,
        rejectPercentage: totalVotes
          ? ((rejectCount / totalVotes) * 100).toFixed(1)
          : 0,
        abstainPercentage: totalVotes
          ? ((abstainCount / totalVotes) * 100).toFixed(1)
          : 0,
        netApproval,
      };
    }
    case "rankedChoice": {
      // Simplified: just return the first‑preference counts
      const firstPref = {};
      policy.pollOptions.forEach((opt) => {
        firstPref[opt.id] = 0;
      });
      votes.forEach((v) => {
        if (Array.isArray(v.value) && v.value.length > 0) {
          const first = v.value[0];
          if (firstPref[first] !== undefined) firstPref[first]++;
        }
      });
      const results = policy.pollOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        firstChoiceCount: firstPref[opt.id],
        percentage: totalVotes
          ? ((firstPref[opt.id] / totalVotes) * 100).toFixed(1)
          : 0,
      }));
      return { totalVotes, firstChoiceResults: results };
    }
    default:
      return { totalVotes };
  }
};

// ---------- Helper: date validation ----------
const parseDate = (dateStr, paramName) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Invalid ${paramName}: ${dateStr}`);
  return d;
};

// ---------- Helper: permission check ----------
const checkAnalyticsAccess = async (policy, user) => {
  if (user.role === "admin") return { allowed: true };
  if (user.role !== "planner") {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Only planners can view analytics",
      statusCode: 403,
    };
  }
  const isOwner = policy.createdBy.toString() === user.id.toString();
  if (isOwner) return { allowed: true };

  // Check if user is an active associate with view_analytics permission
  const PolicyAssociate = require("../models/PolicyAssociate");
  const associate = await PolicyAssociate.findOne({
    policyId: policy._id,
    plannerId: user.id,
    revokedAt: null,
    permissions: "view_analytics",
  });
  if (associate) return { allowed: true };

  return {
    allowed: false,
    errorCode: "NOT_FOUND",
    errorMessage: "Policy not found",
    statusCode: 404,
  };
};

// ---------- Main analytics endpoint with optional demographic filters ----------
exports.getAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(policyId)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Invalid policy ID format",
        null,
        400,
      );
    }
    const {
      startDate,
      endDate,
      gender,
      ageRange,
      occupation,
      education,
      region,
    } = req.query;

    const start = parseDate(startDate, "startDate");
    const end = parseDate(endDate, "endDate");

    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );

    const access = await checkAnalyticsAccess(policy, req.user);
    if (!access.allowed)
      return sendError(
        res,
        access.errorCode,
        access.errorMessage,
        null,
        access.statusCode,
      );

    // Build vote filter
    let voteFilter = { policyId: policy._id };
    if (start) voteFilter.createdAt = { $gte: start };
    if (end) voteFilter.createdAt = { ...voteFilter.createdAt, $lte: end };
    if (gender) voteFilter["demographics.gender"] = gender;
    if (ageRange) voteFilter["demographics.ageRange"] = ageRange;
    if (occupation) voteFilter["demographics.occupation"] = occupation;
    if (education) voteFilter["demographics.education"] = education;
    if (region) voteFilter.region = region;

    const [voteAgg, comments] = await Promise.all([
      getPollTypeAggregation(policy, voteFilter),
      Comment.find({ policyId: policy._id, status: "approved" }).lean(),
    ]);

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const keywordFreq = {};
    comments.forEach((c) => {
      if (c.sentiment?.label) sentimentCounts[c.sentiment.label]++;
      if (c.keywords) {
        c.keywords.forEach((kw) => {
          keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
        });
      }
    });
    const topKeywords = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    const response = {
      policyId: policy._id,
      title: policy.title,
      pollType: policy.pollType,
      ...voteAgg,
      sentimentCounts,
      topKeywords,
    };

    logger.info(
      `Analytics delivered for policy ${policyId} to user ${req.user.id}`,
    );
    return sendSuccess(res, response, "Analytics retrieved successfully");
  } catch (err) {
    console.error("Full error:", err);
    console.error("Error stack:", err.stack);
    logger.error({ error: err.message }, "Get analytics error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve analytics",
      null,
      500,
    );
  }
};

// ---------- Timeseries endpoint ----------
exports.getTimeseries = async (req, res) => {
  try {
    const { policyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(policyId)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Invalid policy ID format",
        null,
        400,
      );
    }
    const { bucket = "day", startDate, endDate } = req.query;

    const start = parseDate(startDate, "startDate");
    const end = parseDate(endDate, "endDate");

    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );

    const access = await checkAnalyticsAccess(policy, req.user);
    if (!access.allowed)
      return sendError(
        res,
        access.errorCode,
        access.errorMessage,
        null,
        access.statusCode,
      );

    let dateFormat;
    switch (bucket) {
      case "hour":
        dateFormat = "%Y-%m-%d %H:00";
        break;
      case "day":
        dateFormat = "%Y-%m-%d";
        break;
      case "week":
        dateFormat = "%Y-%V";
        break;
      case "month":
        dateFormat = "%Y-%m";
        break;
      default:
        dateFormat = "%Y-%m-%d";
    }

    const voteFilter = { policyId: policy._id };
    if (start) voteFilter.createdAt = { $gte: start };
    if (end) voteFilter.createdAt = { ...voteFilter.createdAt, $lte: end };

    let groupStage;
    if (policy.pollType === "binary") {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          total: { $sum: 1 },
          yes: { $sum: { $cond: [{ $eq: ["$value", "yes"] }, 1, 0] } },
        },
      };
    } else if (["rating", "likert"].includes(policy.pollType)) {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          total: { $sum: 1 },
          avg: { $avg: "$value" },
        },
      };
    } else {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          total: { $sum: 1 },
        },
      };
    }

    const timeseries = await Vote.aggregate([
      { $match: voteFilter },
      groupStage,
      { $sort: { _id: 1 } },
    ]);

    const formatted = timeseries.map((t) => ({
      bucket: t._id,
      totalVotes: t.total,
      ...(t.yes !== undefined && { yesCount: t.yes, noCount: t.total - t.yes }),
      ...(t.avg !== undefined && {
        averageRating: parseFloat(t.avg.toFixed(2)),
      }),
    }));

    logger.info(`Timeseries for policy ${policyId} (${bucket}) delivered`);
    return sendSuccess(
      res,
      { bucket, data: formatted },
      "Timeseries retrieved",
    );
  } catch (err) {
    logger.error({ error: err.message }, "Timeseries error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve timeseries",
      null,
      500,
    );
  }
};

// ---------- Correlation for multipleChoice policies ----------
exports.getCorrelation = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { minSupport = 10 } = req.query;

    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );
    if (policy.pollType !== "multipleChoice") {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Correlation only available for multipleChoice policies",
        null,
        400,
      );
    }

    const access = await checkAnalyticsAccess(policy, req.user);
    if (!access.allowed)
      return sendError(
        res,
        access.errorCode,
        access.errorMessage,
        null,
        access.statusCode,
      );

    const votes = await Vote.find({ policyId: policy._id }, "value");
    const optionIds = policy.pollOptions.map((o) => o.id);

    // Build co‑occurrence matrix
    const coOccur = {};
    optionIds.forEach((a) => {
      coOccur[a] = {};
      optionIds.forEach((b) => {
        coOccur[a][b] = 0;
      });
    });
    let totalPairs = 0;
    votes.forEach((v) => {
      const selected = v.value;
      if (Array.isArray(selected) && selected.length > 1) {
        for (let i = 0; i < selected.length; i++) {
          for (let j = i + 1; j < selected.length; j++) {
            const a = selected[i];
            const b = selected[j];
            coOccur[a][b]++;
            coOccur[b][a]++;
            totalPairs++;
          }
        }
      }
    });

    const correlations = [];
    for (let i = 0; i < optionIds.length; i++) {
      for (let j = i + 1; j < optionIds.length; j++) {
        const a = optionIds[i];
        const b = optionIds[j];
        const count = coOccur[a][b];
        if (count >= minSupport) {
          correlations.push({
            optionA: a,
            optionB: b,
            coOccurrenceCount: count,
            percentage: totalPairs
              ? ((count / totalPairs) * 100).toFixed(1)
              : 0,
          });
        }
      }
    }

    logger.info(`Correlation for policy ${policyId} delivered`);
    return sendSuccess(
      res,
      { correlations, totalVotes: votes.length },
      "Correlation matrix retrieved",
    );
  } catch (err) {
    logger.error({ error: err.message }, "Correlation error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to compute correlation",
      null,
      500,
    );
  }
};

// // ---------- Compare two policies ----------
// exports.comparePolicies = async (req, res) => {
//   try {
//     const { policyId1, policyId2 } = req.query;
//     if (!policyId1 || !policyId2) {
//       return sendError(
//         res,
//         ErrorCodes.VALIDATION,
//         "policyId1 and policyId2 are required",
//         null,
//         400,
//       );
//     }

//     const [policy1, policy2] = await Promise.all([
//       Policy.findById(policyId1),
//       Policy.findById(policyId2),
//     ]);
//     if (!policy1 || !policy2)
//       return sendError(
//         res,
//         ErrorCodes.NOT_FOUND,
//         "One or both policies not found",
//         null,
//         404,
//       );

//     // Check access for both
//     const access1 = checkAnalyticsAccess(policy1, req.user);
//     const access2 = checkAnalyticsAccess(policy2, req.user);
//     if (!access1.allowed || !access2.allowed) {
//       return sendError(
//         res,
//         ErrorCodes.FORBIDDEN,
//         "Access denied to one or both policies",
//         null,
//         403,
//       );
//     }

//     const [agg1, agg2] = await Promise.all([
//       getPollTypeAggregation(policy1, { policyId: policy1._id }),
//       getPollTypeAggregation(policy2, { policyId: policy2._id }),
//     ]);

//     const response = {
//       policy1: {
//         id: policy1._id,
//         title: policy1.title,
//         pollType: policy1.pollType,
//         ...agg1,
//       },
//       policy2: {
//         id: policy2._id,
//         title: policy2.title,
//         pollType: policy2.pollType,
//         ...agg2,
//       },
//     };

//     logger.info(`Comparison between ${policyId1} and ${policyId2} delivered`);
//     return sendSuccess(res, response, "Comparison retrieved");
//   } catch (err) {
//     console.error("=== COMPARE POLICIES ERROR ===");
//     console.error("Error name:", err.name);
//     console.error("Error message:", err.message);
//     console.error("Error stack:", err.stack);
//     if (err.errors) console.error("Validation errors:", err.errors);
//     logger.error({ error: err.message, stack: err.stack }, "Compare error");
//     return sendError(
//       res,
//       ErrorCodes.INTERNAL,
//       `Failed to compare policies: ${err.message}`,
//       null,
//       500,
//     );
//   }
// };

// ---------- Demographic breakdown (for planners) ----------
exports.getDemographicBreakdown = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { dimension } = req.query; // one of: ageRange, gender, occupation, education, region
    if (!dimension) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "dimension parameter required (ageRange/gender/occupation/education/region)",
        null,
        400,
      );
    }

    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );

    const access = await checkAnalyticsAccess(policy, req.user);
    if (!access.allowed)
      return sendError(
        res,
        access.errorCode,
        access.errorMessage,
        null,
        access.statusCode,
      );

    const allowedDims = [
      "ageRange",
      "gender",
      "occupation",
      "education",
      "region",
    ];
    if (!allowedDims.includes(dimension)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `Invalid dimension. Allowed: ${allowedDims.join(", ")}`,
        null,
        400,
      );
    }

    let groupField;
    if (dimension === "region") groupField = "$region";
    else groupField = `$demographics.${dimension}`;

    const breakdown = await Vote.aggregate([
      { $match: { policyId: policy._id } },
      {
        $group: {
          _id: groupField,
          count: { $sum: 1 },
          avgRating: { $avg: "$value" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = breakdown.map((b) => ({
      [dimension]: b._id || "unknown",
      totalVotes: b.count,
      averageRating: b.avgRating ? parseFloat(b.avgRating.toFixed(2)) : null,
    }));

    logger.info(`Demographic breakdown for ${policyId} by ${dimension}`);
    return sendSuccess(
      res,
      { dimension, data: formatted },
      "Demographic breakdown retrieved",
    );
  } catch (err) {
    logger.error({ error: err.message }, "Demographic breakdown error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve breakdown",
      null,
      500,
    );
  }
};

// ---------- CSV Export (enhanced) ----------
exports.exportAnalytics = async (req, res) => {
  try {
    const { policyId } = req.params;
    const {
      startDate,
      endDate,
      gender,
      ageRange,
      occupation,
      education,
      region,
    } = req.query;

    const start = parseDate(startDate, "startDate");
    const end = parseDate(endDate, "endDate");

    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );

    const access = await checkAnalyticsAccess(policy, req.user);
    if (!access.allowed)
      return sendError(
        res,
        access.errorCode,
        access.errorMessage,
        null,
        access.statusCode,
      );

    let voteFilter = { policyId: policy._id };
    if (start) voteFilter.createdAt = { $gte: start };
    if (end) voteFilter.createdAt = { ...voteFilter.createdAt, $lte: end };
    if (gender) voteFilter["demographics.gender"] = gender;
    if (ageRange) voteFilter["demographics.ageRange"] = ageRange;
    if (occupation) voteFilter["demographics.occupation"] = occupation;
    if (education) voteFilter["demographics.education"] = education;
    if (region) voteFilter.region = region;

    const votes = await Vote.find(voteFilter).lean();

    let csv =
      "voteId,channel,value,region,ageRange,gender,occupation,education,createdAt\n";
    votes.forEach((v) => {
      const valueStr = Array.isArray(v.value) ? v.value.join("|") : v.value;
      csv += `${v._id},${v.channel},${valueStr},${v.region || ""},${v.demographics?.ageRange || ""},${v.demographics?.gender || ""},${v.demographics?.occupation || ""},${v.demographics?.education || ""},${v.createdAt.toISOString()}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="policy-${policyId}-export.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    logger.error({ error: err.message }, "Export error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to export data",
      null,
      500,
    );
  }
};

// ---------- Comments list (with filtering) ----------
exports.getComments = async (req, res) => {
  try {
    const { policyId } = req.params;
    const {
      page = 1,
      limit = 20,
      sentiment,
      status,
      language,
      parentCommentId = null,
    } = req.query;

    const policy = await Policy.findById(policyId);
    if (!policy)
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "Policy not found",
        null,
        404,
      );

    const access = await checkAnalyticsAccess(policy, req.user);
    if (!access.allowed)
      return sendError(
        res,
        access.errorCode,
        access.errorMessage,
        null,
        access.statusCode,
      );

    const filter = { policyId: policy._id };
    if (parentCommentId === "null") filter.parentCommentId = null;
    else if (parentCommentId) filter.parentCommentId = parentCommentId;
    if (sentiment) filter["sentiment.label"] = sentiment;
    if (status) filter.status = status;
    if (language) filter.language = language;

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("userId", "email")
      .lean();

    const total = await Comment.countDocuments(filter);

    const formatted = comments.map((c) => ({
      id: c._id,
      text: c.text,
      sentiment: c.sentiment?.label,
      confidence: c.sentiment?.confidence,
      keywords: c.keywords,
      status: c.status,
      isOfficialReply: c.isOfficialReply,
      createdAt: c.createdAt,
      userEmail: c.userId?.email,
      isEdited: (c.editedHistory && c.editedHistory.length > 0) || false,
    }));

    return sendSuccess(
      res,
      { comments: formatted, total, page: Number(page) },
      "Comments retrieved",
    );
  } catch (err) {
    logger.error({ error: err.message }, "Get comments error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve comments",
      null,
      500,
    );
  }
};

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
        "Only planners and admins can view heatmap",
        null,
        403,
      );
    }

    const parseDate = (dateStr, paramName) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime()))
        throw new Error(`Invalid ${paramName}: ${dateStr}`);
      return d;
    };

    let start, end;
    try {
      start = parseDate(startDate, "startDate");
      end = parseDate(endDate, "endDate");
    } catch (err) {
      return sendError(res, ErrorCodes.VALIDATION, err.message, null, 400);
    }

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
      if (!policy)
        return sendError(
          res,
          ErrorCodes.NOT_FOUND,
          "Policy not found",
          null,
          404,
        );
      // Reuse existing access check
      const access = await checkAnalyticsAccess(policy, req.user);
      if (!access.allowed) {
        return sendError(
          res,
          access.errorCode,
          access.errorMessage,
          null,
          access.statusCode,
        );
      }
    }

    const voteMatch = { channel: "app", region: { $ne: null } };
    if (policyId) voteMatch.policyId = new mongoose.Types.ObjectId(policyId);
    if (start) voteMatch.createdAt = { $gte: start };
    if (end) voteMatch.createdAt = { ...voteMatch.createdAt, $lte: end };
    if (regions) {
      const regionList = regions.split(",").map((r) => r.trim());
      voteMatch.region = { $in: regionList };
    }

    let dateFormat;
    switch (interval) {
      case "day":
        dateFormat = "%Y-%m-%d";
        break;
      case "week":
        dateFormat = "%Y-%V";
        break;
      case "month":
        dateFormat = "%Y-%m";
        break;
      default:
        dateFormat = "%Y-%V";
    }

    let results;
    if (byRegionFlag) {
      // Group by period + region, compute count and if value is numeric, average it
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
            // For numeric value (rating/likert), compute average; otherwise just count
            numericSum: {
              $sum: { $cond: [{ $isNumber: "$value" }, "$value", 0] },
            },
            numericCount: { $sum: { $cond: [{ $isNumber: "$value" }, 1, 0] } },
            // For binary, count yes
            yesCount: { $sum: { $cond: [{ $eq: ["$value", "yes"] }, 1, 0] } },
          },
        },
        { $sort: { "_id.period": 1, "_id.region": 1 } },
      ]);

      results = voteAgg.map((v) => ({
        period: v._id.period,
        region: v._id.region,
        totalVotes: v.totalVotes,
        averageRating: v.numericCount
          ? (v.numericSum / v.numericCount).toFixed(2)
          : null,
        yesPercentage: v.totalVotes
          ? ((v.yesCount / v.totalVotes) * 100).toFixed(1)
          : null,
      }));
    } else {
      const voteAgg = await Vote.aggregate([
        { $match: voteMatch },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            totalVotes: { $sum: 1 },
            numericSum: {
              $sum: { $cond: [{ $isNumber: "$value" }, "$value", 0] },
            },
            numericCount: { $sum: { $cond: [{ $isNumber: "$value" }, 1, 0] } },
            yesCount: { $sum: { $cond: [{ $eq: ["$value", "yes"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      results = voteAgg.map((v) => ({
        period: v._id,
        totalVotes: v.totalVotes,
        averageRating: v.numericCount
          ? (v.numericSum / v.numericCount).toFixed(2)
          : null,
        yesPercentage: v.totalVotes
          ? ((v.yesCount / v.totalVotes) * 100).toFixed(1)
          : null,
      }));
    }

    logger.info(`Heatmap data generated for user ${req.user.id}`);
    return sendSuccess(res, { interval, data: results }, "Heatmap retrieved");
  } catch (err) {
    logger.error({ error: err.message }, "Heatmap error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to retrieve heatmap",
      null,
      500,
    );
  }
};
