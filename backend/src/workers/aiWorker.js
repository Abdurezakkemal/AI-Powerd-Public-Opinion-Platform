const Feedback = require("../models/Feedback");
const axios = require("axios");

// Mock AI service URL – replace with real when Person 4 provides it
const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000/analyze";

async function processComment(feedback) {
  try {
    const response = await axios.post(AI_SERVICE_URL, {
      text: feedback.comment,
      language: "am", // or auto-detect; we can improve later
    });

    feedback.sentiment = {
      label: response.data.sentiment,
      confidence: response.data.confidence,
    };
    feedback.keywords = response.data.keywords;
    feedback.processed = true;
    await feedback.save();
    console.log(`Processed feedback ${feedback._id}`);
  } catch (err) {
    console.error(`Failed to process feedback ${feedback._id}:`, err.message);
    // Optionally set a flag to retry later, or just leave as unprocessed
  }
}

async function processPendingComments() {
  try {
    const pending = await Feedback.find({
      processed: false,
      comment: { $ne: "" },
    }).limit(10);
    for (const fb of pending) {
      await processComment(fb);
    }
  } catch (err) {
    console.error("Worker error:", err);
  }
}

// Run every 10 seconds
let interval;
function startWorker() {
  if (interval) clearInterval(interval);
  interval = setInterval(processPendingComments, 10000);
  console.log("AI worker started (polling every 10s)");
}

function stopWorker() {
  if (interval) clearInterval(interval);
}

module.exports = { startWorker, stopWorker };
