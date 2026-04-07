const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/models/User");
const Policy = require("./src/models/Policy");
const Feedback = require("./src/models/Feedback");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/civic_engagement";
const DEFAULT_PASSWORD = "Pass123!";

const regions = [
  "Addis Ababa",
  "Oromia",
  "Amhara",
  "Tigray",
  "SNNPR",
  "Adama",
  "Bahir Dar",
  "Mekelle",
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateComment = (sentiment) => {
  const comments = {
    positive: [
      "This policy is excellent! It will help many people. በጣም ጥሩ ፖሊሲ ነው።",
      "I fully support this initiative. Great work!",
      "Finally a policy that addresses our needs. Thank you.",
      "This will improve access to clean water. Very positive step.",
      "The government is listening to citizens. Keep it up!",
    ],
    negative: [
      "This policy does not consider rural areas. Disappointed.",
      "Waste of tax money. No consultation with locals.",
      "Implementation will fail like previous ones. Not happy.",
      "The timeline is unrealistic. We need more time.",
      "Excludes important stakeholders. Bad approach.",
    ],
    neutral: [
      "Need more details before forming an opinion.",
      "Some good points, some concerns. Let's see implementation.",
      "The policy has pros and cons. Neutral for now.",
      "Waiting for pilot results.",
    ],
  };
  return randomItem(comments[sentiment]);
};

const extractKeywordsFromComment = (comment) => {
  const words = comment.toLowerCase().split(/\W+/);
  const common = [
    "policy",
    "water",
    "access",
    "money",
    "government",
    "citizens",
    "implementation",
    "support",
    "time",
    "education",
    "road",
    "health",
    "business",
    "youth",
  ];
  const found = words.filter((w) => common.includes(w) && w.length > 3);
  return [...new Set(found.slice(0, 3))];
};

const getSentimentObject = (label) => {
  const confidence =
    label === "neutral" ? randomInt(50, 80) / 100 : randomInt(70, 98) / 100;
  return { label, confidence };
};

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Drop ALL indexes except _id_ to ensure clean slate
    try {
      const indexes = await Feedback.collection.getIndexes();
      for (const name in indexes) {
        if (name !== "_id_") {
          await Feedback.collection.dropIndex(name);
          console.log(`Dropped index: ${name}`);
        }
      }
    } catch (err) {
      console.log("No indexes to drop or error:", err.message);
    }

    // Clean database (keep admin users)
    console.log("Cleaning database (keeping admin users)...");
    await Feedback.deleteMany({});
    await Policy.deleteMany({});
    await User.deleteMany({ role: { $ne: "admin" } });
    console.log("Cleaned.");

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create citizens (15)
    const citizens = [];
    for (let i = 1; i <= 15; i++) {
      const email = `citizen${i}@test.com`;
      const phoneHash = `hash_${Math.random().toString(36).substring(2, 15)}`;
      const region = randomItem(regions);
      const user = new User({
        email,
        passwordHash,
        phoneHash,
        region,
        role: "citizen",
        verified: true,
        active: true,
      });
      await user.save();
      citizens.push(user);
    }
    console.log(
      `Created ${citizens.length} citizens (password: ${DEFAULT_PASSWORD})`,
    );

    // Create planners (2)
    const planners = [];
    for (let i = 1; i <= 2; i++) {
      const email = `planner${i}@test.com`;
      const user = new User({
        email,
        passwordHash,
        phoneHash: null,
        region: "",
        role: "planner",
        verified: true,
        active: true,
      });
      await user.save();
      planners.push(user);
    }
    console.log(
      `Created ${planners.length} planners (password: ${DEFAULT_PASSWORD})`,
    );

    // Create policies (6)
    const policyTitles = [
      "Clean Water Access Initiative",
      "Digital Education for All",
      "Rural Road Development",
      "Healthcare Modernization",
      "Small Business Support",
      "Youth Employment Scheme",
    ];
    const policies = [];
    for (let i = 0; i < policyTitles.length; i++) {
      const title = policyTitles[i];
      const description = `${title} – a comprehensive policy to improve lives.`;
      const targetRegions = [randomItem(regions), randomItem(regions)].slice(
        0,
        randomInt(1, 2),
      );
      const startDate = new Date("2026-02-01");
      const endDate = new Date("2026-07-30");
      let status = "draft";
      if (i >= 2 && i <= 4) status = "active";
      else if (i === 5) status = "closed";
      const createdBy = randomItem(planners)._id;
      const policyCode =
        title.substring(0, 4).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      const policy = new Policy({
        title,
        description,
        targetRegions,
        policyCode,
        startDate,
        endDate,
        status,
        createdBy,
      });
      await policy.save();
      policies.push(policy);
    }
    console.log(
      `Created ${policies.length} policies (active: ${policies.filter((p) => p.status === "active").length}, closed: ${policies.filter((p) => p.status === "closed").length}, draft: ${policies.filter((p) => p.status === "draft").length})`,
    );

    // Create feedback – avoid duplicate key errors
    const usedAppPairs = new Set(); // key: "policyId_userId"
    const usedSmsPhones = new Set(); // key: "policyId_phoneHash"
    const feedbacks = [];
    let attempts = 0;
    const target = 40;

    while (feedbacks.length < target && attempts < 500) {
      attempts++;
      const policy = randomItem(policies);
      if (policy.status !== "active") continue;

      const channel = Math.random() < 0.7 ? "app" : "sms";
      let userId = null;
      let phoneHash = null;
      let uniqueKey = null;

      if (channel === "app") {
        // Find eligible citizen
        let eligible = citizens.filter(
          (c) =>
            policy.targetRegions.includes(c.region) &&
            !usedAppPairs.has(`${policy._id}_${c._id}`),
        );
        if (eligible.length === 0) {
          eligible = citizens.filter(
            (c) => !usedAppPairs.has(`${policy._id}_${c._id}`),
          );
        }
        if (eligible.length === 0) continue;
        const citizen = randomItem(eligible);
        userId = citizen._id;
        if (!userId) continue; // safety
        uniqueKey = `${policy._id}_${userId}`;
        if (usedAppPairs.has(uniqueKey)) continue;
        usedAppPairs.add(uniqueKey);
      } else {
        // SMS
        let smsHash, smsKey;
        do {
          smsHash = `sms_${Math.random().toString(36).substring(2, 10)}`;
          smsKey = `${policy._id}_${smsHash}`;
        } while (usedSmsPhones.has(smsKey));
        usedSmsPhones.add(smsKey);
        phoneHash = smsHash;
        uniqueKey = smsKey;
      }

      const rating = randomInt(1, 5);
      const hasComment = Math.random() > 0.3;
      let comment = "";
      let sentimentObj = null;
      let keywords = [];
      let processed = false;
      let status = "processing";

      if (hasComment) {
        let sentimentLabel =
          rating <= 2 ? "negative" : rating === 3 ? "neutral" : "positive";
        comment = generateComment(sentimentLabel);
        sentimentObj = getSentimentObject(sentimentLabel);
        keywords = extractKeywordsFromComment(comment);
        processed = true;
        status = "processed";
        if (Math.random() < 0.1) {
          status = "pending review";
          processed = false;
          sentimentObj = { label: "neutral", confidence: 0 };
          keywords = [];
        }
      } else {
        processed = true;
        status = "processed";
        sentimentObj = { label: "neutral", confidence: 0 };
        keywords = [];
      }

      const createdAt = randomDate(new Date("2026-02-01"), new Date());

      // Build feedback object – NEVER include null values
      const feedbackData = {
        policyId: policy._id,
        channel,
        rating,
        comment: comment || "",
        sentiment: sentimentObj,
        keywords,
        processed,
        retryCount: 0,
        nextRetry: null,
        status,
        createdAt,
      };

      if (channel === "app") {
        feedbackData.userId = userId;
        // Do NOT add phoneHash
      } else {
        feedbackData.phoneHash = phoneHash;
        // Do NOT add userId
      }

      const feedback = new Feedback(feedbackData);
      await feedback.save();
      feedbacks.push(feedback);
    }

    console.log(
      `Created ${feedbacks.length} feedback entries (votes/comments)`,
    );
    const activePolicyWithFeedback = policies.find(
      (p) =>
        p.status === "active" &&
        feedbacks.some((f) => f.policyId.toString() === p._id.toString()),
    );
    if (activePolicyWithFeedback) {
      console.log(
        `\n🔍 Use this policy ID for analytics testing: ${activePolicyWithFeedback._id}`,
      );
      console.log(`   Policy title: ${activePolicyWithFeedback.title}`);
    } else {
      console.log(
        "\n⚠️ No active policy with feedback. Try running seed again or check policy status.",
      );
    }
    console.log(
      `\n✅ Test credentials (all use password: ${DEFAULT_PASSWORD})`,
    );
    console.log(`   Planner: planner1@test.com`);
    console.log(`   Citizen: citizen1@test.com`);

    await mongoose.disconnect();
    console.log("Disconnected.");
  } catch (err) {
    console.error("Seeding error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
