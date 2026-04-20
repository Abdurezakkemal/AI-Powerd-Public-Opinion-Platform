/**
 * Cleanup script – selectively delete data from the database.
 *
 * Usage:
 *   node scripts/cleanup.js [options]
 *
 * Options:
 *   --citizens, -c      Delete all citizen users (role: citizen)
 *   --planners, -p      Delete all planner users (role: planner)
 *   --admins, -a        Delete all admin users (role: admin) – DANGEROUS
 *   --feedback, -f      Delete all feedback documents
 *   --policies, -P      Delete all policies
 *   --sms-feedback      Delete all SMS votes (channel: sms)
 *   --all               Delete EVERYTHING (citizens, planners, feedback, policies, but NOT admins unless --admins also given)
 *   --dry-run           Show what would be deleted without actually deleting
 *   --help, -h          Show this help message
 *
 * Examples:
 *   node scripts/cleanup.js --citizens --planners
 *   node scripts/cleanup.js --all
 *   node scripts/cleanup.js --feedback --policies --dry-run
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");
const Policy = require("../src/models/Policy");
const Feedback = require("../src/models/Feedback");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/civic_engagement";

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  citizens: false,
  planners: false,
  admins: false,
  feedback: false,
  policies: false,
  smsFeedback: false,
  all: false,
  dryRun: false,
  help: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case "--citizens":
    case "-c":
      flags.citizens = true;
      break;
    case "--planners":
    case "-p":
      flags.planners = true;
      break;
    case "--admins":
    case "-a":
      flags.admins = true;
      break;
    case "--feedback":
    case "-f":
      flags.feedback = true;
      break;
    case "--policies":
    case "-P":
      flags.policies = true;
      break;
    case "--sms-feedback":
      flags.smsFeedback = true;
      break;
    case "--all":
      flags.all = true;
      break;
    case "--dry-run":
      flags.dryRun = true;
      break;
    case "--help":
    case "-h":
      flags.help = true;
      break;
    default:
      console.error(`Unknown option: ${arg}`);
      flags.help = true;
  }
}

if (flags.help) {
  console.log(`
Cleanup script – selectively delete data.

Usage: node scripts/cleanup.js [options]

Options:
  --citizens, -c      Delete all citizen users (role: citizen)
  --planners, -p      Delete all planner users (role: planner)
  --admins, -a        Delete all admin users (role: admin) – DANGEROUS
  --feedback, -f      Delete all feedback documents
  --policies, -P      Delete all policies
  --sms-feedback      Delete all SMS votes (channel: sms)
  --all               Delete EVERYTHING (citizens, planners, feedback, policies, but NOT admins unless --admins also given)
  --dry-run           Show what would be deleted without actually deleting
  --help, -h          Show this help

Examples:
  node scripts/cleanup.js --citizens --planners
  node scripts/cleanup.js --all
  node scripts/cleanup.js --feedback --policies --dry-run
  `);
  process.exit(0);
}

// If --all is set, enable everything except admins (unless --admins also set)
if (flags.all) {
  flags.citizens = true;
  flags.planners = true;
  flags.feedback = true;
  flags.policies = true;
  // admins remain false unless explicitly requested
}

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const deletions = [];

    // Citizens
    if (flags.citizens) {
      const result = await User.deleteMany({ role: "citizen" });
      deletions.push(`Citizens: ${result.deletedCount} deleted`);
    }

    // Planners
    if (flags.planners) {
      const result = await User.deleteMany({ role: "planner" });
      deletions.push(`Planners: ${result.deletedCount} deleted`);
    }

    // Admins (dangerous)
    if (flags.admins) {
      const result = await User.deleteMany({ role: "admin" });
      deletions.push(`Admins: ${result.deletedCount} deleted`);
    }

    // Feedback (all)
    if (flags.feedback) {
      const result = await Feedback.deleteMany({});
      deletions.push(`Feedback (all): ${result.deletedCount} deleted`);
    }

    // SMS feedback only
    if (flags.smsFeedback) {
      const result = await Feedback.deleteMany({ channel: "sms" });
      deletions.push(`SMS feedback: ${result.deletedCount} deleted`);
    }

    // Policies
    if (flags.policies) {
      const result = await Policy.deleteMany({});
      deletions.push(`Policies: ${result.deletedCount} deleted`);
    }

    if (deletions.length === 0) {
      console.log("Nothing to delete. Use --help to see options.");
    } else {
      if (flags.dryRun) {
        console.log("\n[DRY RUN] Would delete:");
        deletions.forEach((d) => console.log(`  - ${d}`));
      } else {
        console.log("\nDeleted:");
        deletions.forEach((d) => console.log(`  - ${d}`));
      }
    }

    await mongoose.disconnect();
    console.log("\nDisconnected.");
  } catch (err) {
    console.error("Cleanup error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanup();
