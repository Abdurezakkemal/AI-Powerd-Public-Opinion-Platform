require("dotenv").config();

const Comment = require("../models/Comment");
const axios = require("axios");
const AI_BASE = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_ANALYZE_URL = `${AI_BASE}/analyze`;
const POLL_INTERVAL = 10000; // 10 seconds
const MAX_AGE_HOURS = 24;
const MAX_BACKOFF_MS = 60 * 60 * 1000; // 1 hour
const CONFIDENCE_THRESHOLD = 0.7; // configurable

const computeNextRetry = (retryCount) => {
  const delay = Math.min(Math.pow(2, retryCount) * 1000, MAX_BACKOFF_MS);
  return new Date(Date.now() + delay);
};

const isTooOld = (comment) => {
  const age = Date.now() - new Date(comment.createdAt).getTime();
  return age > MAX_AGE_HOURS * 60 * 60 * 1000;
};

const processComment = async (comment) => {
  try {
    const response = await axios.post(
      AI_ANALYZE_URL,
      { text: comment.text, language: null },
      {
        timeout: 60000, // 60 seconds for remote Hugging Face Spaces (cold start can take 30s)
        headers: { "X-Internal-API-Key": process.env.INTERNAL_API_KEY },
      },
    );

    const aiData = response.data;
    const sentiment = {
      label: aiData.sentiment,
      confidence: aiData.confidence,
    };
    const keywords = aiData.keywords || [];

    comment.sentiment = sentiment;
    comment.keywords = keywords;
    comment.language = aiData.language;
    comment.aiPrediction = aiData;

    // Decide moderation status based on confidence
    if (sentiment.confidence >= CONFIDENCE_THRESHOLD) {
      comment.moderationStatus = "none";
      comment.moderationReason = null;
    } else {
      comment.moderationStatus = "needs_review";
      comment.moderationReason = "low_confidence";
    }
    // visibility remains "visible" (never change here)

    comment.retryCount = 0;
    comment.nextRetry = null;
    await comment.save();
    console.log(
      `Processed comment ${comment._id} (confidence: ${sentiment.confidence})`,
    );
  } catch (err) {
    console.error(`AI request failed for comment ${comment._id}:`, err.message);

    if (isTooOld(comment)) {
      comment.moderationStatus = "needs_review";
      comment.moderationReason = "low_confidence";
      comment.sentiment = null;
      comment.keywords = [];
      await comment.save();
      console.log(`Comment ${comment._id} too old -> needs_review`);
      return;
    }

    comment.retryCount += 1;
    comment.nextRetry = computeNextRetry(comment.retryCount);
    await comment.save();
    console.log(
      `Comment ${comment._id} failed (attempt ${comment.retryCount}), next retry at ${comment.nextRetry}`,
    );
  }
};

const processPendingComments = async () => {
  try {
    const now = new Date();
    const pending = await Comment.find({
      moderationStatus: "pending_ai",
      $or: [{ nextRetry: null }, { nextRetry: { $lte: now } }],
    }).limit(10);

    if (pending.length) {
      await Promise.all(pending.map((c) => processComment(c)));
    }
  } catch (err) {
    console.error("Worker error:", err);
  }
};

let interval;
function startWorker() {
  if (interval) clearInterval(interval);
  interval = setInterval(processPendingComments, POLL_INTERVAL);
  console.log(`AI worker started (polling every ${POLL_INTERVAL / 1000}s)`);
}

function stopWorker() {
  if (interval) clearInterval(interval);
  console.log("AI worker stopped");
}

module.exports = { startWorker, stopWorker };
