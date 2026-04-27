require("dotenv").config(); // Ensure environment variables are loaded

const Feedback = require("../models/Feedback");
const axios = require("axios");

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000/analyze";
const POLL_INTERVAL = 10000; // 10 seconds
const MAX_AGE_HOURS = 24; // after this age, mark as pending review
const MAX_BACKOFF_MS = 60 * 60 * 1000; // 1 hour

// Compute next retry delay with exponential backoff (capped)
const computeNextRetry = (retryCount) => {
  const delay = Math.min(Math.pow(2, retryCount) * 1000, MAX_BACKOFF_MS);
  return new Date(Date.now() + delay);
};

// Check if feedback is too old (older than MAX_AGE_HOURS)
const isTooOld = (feedback) => {
  const age = Date.now() - new Date(feedback.createdAt).getTime();
  return age > MAX_AGE_HOURS * 60 * 60 * 1000;
};

// Process a single feedback
const processComment = async (feedback) => {
  try {
    const response = await axios.post(
      AI_SERVICE_URL,
      { text: feedback.comment, language: "am" },
      {
        timeout: 5000,
        headers: {
          "X-Internal-API-Key": process.env.INTERNAL_API_KEY,
        },
      },
    );

    // AI service responded, check if it can analyze
    if (response.data.status === "cannot_analyze") {
      feedback.status = "pending review";
      feedback.processed = true;
      feedback.sentiment = { label: "neutral", confidence: 0 };
      feedback.keywords = [];
      feedback.retryCount = 0;
      feedback.nextRetry = null;
      await feedback.save();
      console.log(
        `Feedback ${feedback._id} marked as pending review (AI cannot analyze)`,
      );
      return;
    }

    // Success
    feedback.sentiment = {
      label: response.data.sentiment,
      confidence: response.data.confidence,
    };
    feedback.keywords = response.data.keywords;
    feedback.processed = true;
    feedback.status = "processed";
    feedback.retryCount = 0;
    feedback.nextRetry = null;
    await feedback.save();
    console.log(`Processed feedback ${feedback._id}`);
  } catch (err) {
    // Failure – if too old, mark as pending review
    if (isTooOld(feedback)) {
      feedback.status = "pending review";
      feedback.processed = true;
      feedback.sentiment = { label: "neutral", confidence: 0 };
      feedback.keywords = [];
      feedback.retryCount = 0;
      feedback.nextRetry = null;
      await feedback.save();
      console.error(
        `Feedback ${feedback._id} too old (${MAX_AGE_HOURS}h) -> pending review`,
      );
      return;
    }

    // Not too old – schedule retry
    feedback.retryCount += 1;
    feedback.nextRetry = computeNextRetry(feedback.retryCount);
    await feedback.save();
    console.log(
      `Feedback ${feedback._id} failed (attempt ${feedback.retryCount}), next retry at ${feedback.nextRetry}`,
    );
  }
};

// Main polling function
const processPendingComments = async () => {
  try {
    const pending = await Feedback.find({
      processed: false,
      comment: { $ne: "" },
      $or: [{ nextRetry: null }, { nextRetry: { $lte: new Date() } }],
    }).limit(10);

    if (pending.length) {
      await Promise.all(pending.map((fb) => processComment(fb)));
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
