const Policy = require("../models/Policy");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { hashPhone, normalizePhone } = require("../utils/helpers");
const client = require("../config/redis");

const RATE_LIMIT = 3;
const RATE_WINDOW = 24 * 60 * 60;

exports.receiveSms = async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).send("Phone and message are required");
    }

    const trimmed = message.trim().toUpperCase();

    // ✅ HELP command
    if (trimmed === "HELP") {
      return res.send(
        "Commands:\n" +
          "RATE <code> <1-5> - Vote on a policy\n" +
          "RESULTS <code> - Get final results\n" +
          "HELP - Show this message",
      );
    }

    // Normalize phone
    const normalized = normalizePhone(phone);
    const phoneHash = hashPhone(normalized); // use normalized for consistency

    // Parse message: RATE <code> <rating>
    const match = message.trim().match(/^RATE\s+(\S+)\s+([1-5])$/i);
    if (!match) {
      return res
        .status(400)
        .send("Invalid format. Use: RATE code rating (e.g., RATE POL123 4)");
    }

    const policyCode = match[1];
    const rating = parseInt(match[2], 10);

    // Find policy by code
    const policy = await Policy.findOne({ policyCode, status: "active" });
    if (!policy) {
      return res.status(404).send("Policy not found or not active");
    }

    // Check if this phone is already registered as an app user
    const existingUser = await User.findOne({ phoneHash });
    if (existingUser && existingUser.verified) {
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
      return res
        .status(409)
        .send("You have already voted on this policy via SMS.");
    }

    // Rate limiting – use hash as key
    const rateKey = `rate:sms:${phoneHash}:${new Date().toISOString().split("T")[0]}`;
    const current = await client.incr(rateKey);
    if (current === 1) {
      await client.expire(rateKey, RATE_WINDOW);
    }
    if (current > RATE_LIMIT) {
      const ttl = await client.ttl(rateKey);
      const hours = Math.ceil(ttl / 3600);

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

    res.send(`You voted ${rating} stars for "${policy.title}". Thank you!`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.getResults = async (req, res) => {
  try {
    const { phone, code } = req.query;
    if (!code) {
      return res.status(400).send("Policy code is required");
    }

    const policy = await Policy.findOne({ policyCode: code, status: "closed" });
    if (!policy) {
      return res.status(404).send("Policy not found or not yet closed");
    }

    const feedbacks = await Feedback.find({ policyId: policy._id });
    const totalVotes = feedbacks.length;
    const avgRating = totalVotes
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalVotes).toFixed(
          2,
        )
      : 0;

    res.send(
      `Policy: ${policy.title} – Final average rating: ${avgRating} stars (${totalVotes} votes)`,
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
