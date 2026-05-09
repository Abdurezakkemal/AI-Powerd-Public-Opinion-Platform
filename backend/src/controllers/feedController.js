const Policy = require("../models/Policy");
const UserInteraction = require("../models/UserInteraction");
const { getUserKeywordProfile } = require("../services/keywordProfileService");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

// Helper: compute demographic boost score based on relevanceFactors
const computeDemographicScore = (policy, user) => {
  let score = 0;
  const factors = policy.relevanceFactors || {};
  // women
  if (factors.women && user.gender === "female") score += 5;
  // youth (age 18-34 considered youth)
  if (factors.youth && ["18-24", "25-34"].includes(user.ageRange)) score += 5;
  // farmers
  if (factors.farmers && user.occupation === "farmer") score += 5;
  // urban
  if (factors.urban && user.region?.toLowerCase().includes("city")) score += 3; // simplistic
  // rural
  if (factors.rural && !user.region?.toLowerCase().includes("city")) score += 3;
  // private sector
  if (factors.privateSector && user.occupation === "private-sector") score += 4;
  // government
  if (factors.government && user.occupation === "government-employee")
    score += 4;
  return score;
};

// Helper: compute content similarity score using topics
const computeContentScore = (policyTopics, userKeywordProfile) => {
  if (!policyTopics.length || Object.keys(userKeywordProfile).length === 0)
    return 0;
  let overlap = 0;
  for (const topic of policyTopics) {
    if (userKeywordProfile[topic]) overlap += userKeywordProfile[topic];
  }
  // normalize by maximum possible (sum of user weights) -> roughly cosine similarity but simple
  const totalUserWeight = Object.values(userKeywordProfile).reduce(
    (a, b) => a + b,
    0,
  );
  return totalUserWeight ? overlap / totalUserWeight : 0;
};

// GET /api/feed
exports.getFeed = async (req, res) => {
  try {
    console.log("=== FEED START ===");
    console.log("User from auth:", JSON.stringify(req.user, null, 2));
    const userId = req.user.id;
    console.log("userId:", userId);

    if (req.user.role !== "citizen") {
      return sendError(
        res,
        ErrorCodes.FORBIDDEN,
        "Feed only for citizens",
        null,
        403,
      );
    }

    const cacheKey = `feed:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return sendSuccess(res, JSON.parse(cached), "Feed (cached)");
    }

    console.log("Fetching policies...");
    const policies = await Policy.find({
      status: "active",
      targetRegions: req.user.region,
    }).lean();
    console.log(`Found ${policies.length} policies`);

    if (!policies.length) {
      return sendSuccess(res, [], "No active policies");
    }

    console.log("Getting user keyword profile...");
    const userKeywordProfile = await getUserKeywordProfile(userId);
    console.log("Keyword profile:", userKeywordProfile);

    const scored = policies.map((policy) => {
      const demoScore = computeDemographicScore(policy, req.user);
      const contentScore = computeContentScore(
        policy.topics || [],
        userKeywordProfile,
      );
      const totalScore = demoScore * 0.7 + contentScore * 10 * 0.3;
      return { policy, score: totalScore };
    });

    scored.sort((a, b) => b.score - a.score);

    const feed = scored.map((item) => ({
      id: item.policy._id,
      title: item.policy.title,
      description: item.policy.description,
      policyCode: item.policy.policyCode,
      pollType: item.policy.pollType,
      startDate: item.policy.startDate,
      endDate: item.policy.endDate,
      targetRegions: item.policy.targetRegions,
      relevanceScore: item.score.toFixed(2),
    }));

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(feed));
    console.log("Feed generated successfully");
    return sendSuccess(res, feed, "Personalized feed");
  } catch (err) {
    console.error("Feed error details:", err);
    console.error("Stack:", err.stack);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to generate feed: " + err.message,
      null,
      500,
    );
  }
};
// POST /api/feed/interact - record when user clicks/view a policy from feed
exports.recordInteraction = async (req, res) => {
  try {
    const { policyId, type } = req.body;
    if (!policyId || !["view", "vote", "comment"].includes(type)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "policyId and valid type required",
        null,
        400,
      );
    }
    // Check if already exists (to avoid duplicates for same interaction)
    const existing = await UserInteraction.findOne({
      userId: req.user.id,
      policyId,
      type,
    });
    if (!existing) {
      await UserInteraction.create({ userId: req.user.id, policyId, type });
    }
    // Invalidate feed cache for user
    await redisClient.del(`feed:${req.user.id}`);
    return sendSuccess(res, null, "Interaction recorded");
  } catch (err) {
    logger.error({ error: err.message }, "Record interaction error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to record interaction",
      null,
      500,
    );
  }
};
