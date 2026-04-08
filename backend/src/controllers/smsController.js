const Policy = require("../models/Policy");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { hashPhone, normalizePhone } = require("../utils/helpers");
const client = require("../config/redis");
const logger = require("../utils/logger");

const RATE_LIMIT = 3;
const RATE_WINDOW = 24 * 60 * 60;

exports.receiveSms = async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      logger.warn("SMS request missing phone or message");
      return res.status(400).send("Phone and message are required");
    }

    const trimmed = message.trim().toUpperCase();

    // HELP command
    if (trimmed === "HELP") {
      logger.info(`SMS HELP from ${phone}`);
      return res.send(
        "Commands:\n" +
          "RATE <code> <1-5> - Vote on a policy\n" +
          "RESULTS <code> - Get final results\n" +
          "HELP - Show this message",
      );
    }

    // Normalize phone
    const normalized = normalizePhone(phone);
    const phoneHash = hashPhone(normalized);

    // Parse message: RATE <code> <rating>
    const match = message.trim().match(/^RATE\s+(\S+)\s+([1-5])$/i);
    if (!match) {
      logger.warn(`Invalid SMS format from ${normalized}: ${message}`);
      return res
        .status(400)
        .send("Invalid format. Use: RATE code rating (e.g., RATE POL123 4)");
    }

    const policyCode = match[1];
    const rating = parseInt(match[2], 10);

    // Find policy by code
    const policy = await Policy.findOne({ policyCode, status: "active" });
    if (!policy) {
      logger.warn(
        `SMS vote for invalid/inactive policy code: ${policyCode} from ${normalized}`,
      );
      return res.status(404).send("Policy not found or not active");
    }

    // Check if this phone is already registered as an app user
    const existingUser = await User.findOne({ phoneHash });
    if (existingUser && existingUser.verified) {
      logger.warn(`Registered app user attempted SMS vote: ${normalized}`);
      return res
        .status(403)
        .send(
          "This number is registered with the app. Please use the app to vote.",
        );
    }

    // Check duplicate SMS vote on this policy
    const existingVote = await Feedback.findOne({
      policyId: policy._id,
      phoneHash,
    });
    if (existingVote) {
      logger.warn(
        `Duplicate SMS vote for policy ${policyCode} from ${normalized}`,
      );
      return res
        .status(409)
        .send("You have already voted on this policy via SMS.");
    }

    // Rate limiting
    const rateKey = `rate:sms:${phoneHash}:${new Date().toISOString().split("T")[0]}`;
    const current = await client.incr(rateKey);
    if (current === 1) {
      await client.expire(rateKey, RATE_WINDOW);
    }
    if (current > RATE_LIMIT) {
      const ttl = await client.ttl(rateKey);
      const hours = Math.ceil(ttl / 3600);
      logger.warn(
        `SMS rate limit exceeded for ${normalized} (${current} votes today)`,
      );
      return res
        .status(429)
        .send(
          `You have reached your daily limit of ${RATE_LIMIT} votes. Try again in ${hours} hour(s).`,
        );
    }

    // Save feedback
    const feedback = new Feedback({
      policyId: policy._id,
      phoneHash,
      channel: "sms",
      rating,
      processed: true, // no comment, so no AI needed
    });
    await feedback.save();

    logger.info(
      `SMS vote recorded: ${normalized} rated ${rating} for policy ${policyCode}`,
    );
    res.send(`You voted ${rating} stars for "${policy.title}". Thank you!`);
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "SMS receive error");
    res.status(500).send("Server error");
  }
};

exports.getResults = async (req, res) => {
  try {
    const { phone, code } = req.query;
    if (!code) {
      logger.warn("SMS results request missing policy code");
      return res.status(400).send("Policy code is required");
    }

    const policy = await Policy.findOne({ policyCode: code, status: "closed" });
    if (!policy) {
      logger.warn(
        `SMS results request for invalid/non-closed policy code: ${code}`,
      );
      return res.status(404).send("Policy not found or not yet closed");
    }

    const feedbacks = await Feedback.find({ policyId: policy._id });
    const totalVotes = feedbacks.length;
    const avgRating = totalVotes
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalVotes).toFixed(
          2,
        )
      : 0;

    logger.info(
      `SMS results sent for policy ${code} to ${phone || "anonymous"}`,
    );
    res.send(
      `Policy: ${policy.title} – Final average rating: ${avgRating} stars (${totalVotes} votes)`,
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "SMS results error");
    res.status(500).send("Server error");
  }
};
