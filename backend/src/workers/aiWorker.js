require("dotenv").config();

const Comment = require("../models/Comment");
const axios = require("axios");
const AI_BASE = process.env.AI_SERVICE_URL || "http://localhost:8000";
const base = AI_BASE;
const AI_ANALYZE_URL = `${base}/analyze`;
const POLL_INTERVAL = 10000; // 10 seconds
const MAX_AGE_HOURS = 24;
const MAX_BACKOFF_MS = 60 * 60 * 1000; // 1 hour

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
      { text: comment.comment, language: "am" },
      {
        timeout: 5000,
        headers: {
          "X-Internal-API-Key": process.env.INTERNAL_API_KEY,
        },
      },
    );

    if (response.data.status === "cannot_analyze") {
      comment.status = "pending_review";
      comment.processed = true;
      comment.sentiment = { label: "neutral", confidence: 0 };
      comment.keywords = [];
      comment.retryCount = 0;
      comment.nextRetry = null;
      await comment.save();
      console.log(
        `Comment ${comment._id} marked as pending review (AI cannot analyze)`,
      );
      return;
    }

    comment.sentiment = {
      label: response.data.sentiment,
      confidence: response.data.confidence,
    };
    comment.keywords = response.data.keywords;
    comment.processed = true;
    comment.status = "processed";
    comment.retryCount = 0;
    comment.nextRetry = null;
    await comment.save();
    console.log(`Processed comment ${comment._id}`);
  } catch (err) {
    if (isTooOld(comment)) {
      comment.status = "pending_review";
      comment.processed = true;
      comment.sentiment = { label: "neutral", confidence: 0 };
      comment.keywords = [];
      comment.retryCount = 0;
      comment.nextRetry = null;
      await comment.save();
      console.error(
        `Comment ${comment._id} too old (${MAX_AGE_HOURS}h) -> pending review`,
      );
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
    const pending = await Comment.find({
      processed: false,
      comment: { $ne: "" },
      $or: [{ nextRetry: null }, { nextRetry: { $lte: new Date() } }],
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
