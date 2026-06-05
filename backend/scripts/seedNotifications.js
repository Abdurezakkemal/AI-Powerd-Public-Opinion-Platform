const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");
const Policy = require("../src/models/Policy");
const Comment = require("../src/models/Comment");
const Notification = require("../src/models/Notification");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/communityinsight";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedNotifications() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // Fetch users and policies
    const citizens = await User.find({ role: "citizen" }).limit(10);
    const planners = await User.find({ role: "planner" }).limit(5);
    const admin = await User.findOne({ role: "admin" });
    const policies = await Policy.find({}).limit(5);
    const comments = await Comment.find({}).limit(5);

    if (citizens.length === 0) {
      console.log("No citizens found. Run seed.js first.");
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${citizens.length} citizens, ${planners.length} planners, ${policies.length} policies`);

    // Clear existing notifications
    console.log("Clearing existing notifications...");
    await Notification.deleteMany({});

    const notifications = [];

    // Helper to create notification
    const createNotif = (userId, userRole, type, title, message, data = {}, severity = "info", daysAgo = 0) => {
      return {
        userId,
        userRole,
        type,
        title,
        message,
        data,
        read: Math.random() < 0.3, // 30% read
        severity,
        source: type.includes("VOTE_SURGE") || type.includes("RATING_DROP") || type.includes("EMERGING_TOPIC") ? "alert" : "system",
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      };
    };

    // 1. Policy notifications for citizens
    console.log("Creating policy notifications...");
    for (const citizen of citizens.slice(0, 5)) {
      if (policies.length > 0) {
        const policy = randomItem(policies);
        
        // POLICY_ACTIVATED
        notifications.push(createNotif(
          citizen._id,
          "citizen",
          "POLICY_ACTIVATED",
          "New Policy Available",
          `A new policy "${policy.title}" is now open for your input.`,
          { policyId: policy._id, policyTitle: policy.title },
          "info",
          randomInt(1, 5)
        ));

        // POLICY_EXTENDED
        if (Math.random() < 0.3) {
          notifications.push(createNotif(
            citizen._id,
            "citizen",
            "POLICY_EXTENDED",
            "Policy Deadline Extended",
            `The deadline for "${policy.title}" has been extended. You have more time to participate.`,
            { policyId: policy._id, policyTitle: policy.title, newEndDate: policy.endDate },
            "info",
            randomInt(1, 3)
          ));
        }

        // POLICY_CLOSED
        if (Math.random() < 0.3) {
          notifications.push(createNotif(
            citizen._id,
            "citizen",
            "POLICY_CLOSED",
            "Policy Closed",
            `The policy "${policy.title}" has been closed. Thank you for participating.`,
            { policyId: policy._id, policyTitle: policy.title },
            "info",
            randomInt(1, 2)
          ));
        }
      }
    }

    // 2. Comment notifications
    console.log("Creating comment notifications...");
    for (const citizen of citizens.slice(0, 8)) {
      if (comments.length > 0 && policies.length > 0) {
        const comment = randomItem(comments);
        const policy = randomItem(policies);

        // COMMENT_REPLY
        if (Math.random() < 0.5) {
          const replier = randomItem(citizens);
          notifications.push(createNotif(
            citizen._id,
            "citizen",
            "COMMENT_REPLY",
            "New Reply to Your Comment",
            `${replier.email.split("@")[0]} replied to your comment on "${policy.title}".`,
            { 
              commentId: comment._id, 
              policyId: policy._id, 
              policyTitle: policy.title,
              replyText: "I agree with your perspective on this."
            },
            "info",
            randomInt(1, 7)
          ));
        }

        // COMMENT_FLAGGED (for planners/admin)
        if (planners.length > 0 && Math.random() < 0.4) {
          const planner = randomItem(planners);
          notifications.push(createNotif(
            planner._id,
            "planner",
            "COMMENT_FLAGGED",
            "Comment Flagged for Review",
            `A comment on "${policy.title}" has been flagged and needs moderation.`,
            { 
              commentId: comment._id, 
              policyId: policy._id, 
              policyTitle: policy.title,
              reason: "Reported by multiple users"
            },
            "warning",
            randomInt(1, 4)
          ));
        }

        // APPEAL_RESOLVED
        if (Math.random() < 0.2) {
          notifications.push(createNotif(
            citizen._id,
            "citizen",
            "APPEAL_RESOLVED",
            "Your Appeal Has Been Resolved",
            `Your appeal for a comment on "${policy.title}" has been reviewed and resolved.`,
            { 
              commentId: comment._id, 
              policyId: policy._id, 
              policyTitle: policy.title,
              resolution: "approved"
            },
            "info",
            randomInt(1, 3)
          ));
        }
      }
    }

    // 3. Delegation notifications
    console.log("Creating delegation notifications...");
    for (const citizen of citizens.slice(0, 4)) {
      // ASSOCIATE_INVITED
      if (Math.random() < 0.3) {
        const inviter = randomItem(planners.length > 0 ? planners : citizens);
        notifications.push(createNotif(
          citizen._id,
          "citizen",
          "ASSOCIATE_INVITED",
          "Policy Delegation Invitation",
          `${inviter.email.split("@")[0]} has invited you to collaborate on policy management.`,
          { 
            inviterId: inviter._id, 
            inviterName: inviter.email.split("@")[0],
            permissions: ["vote", "comment"]
          },
          "info",
          randomInt(1, 5)
        ));
      }

      // ASSOCIATE_ACCEPTED
      if (Math.random() < 0.2) {
        const accepter = randomItem(citizens);
        notifications.push(createNotif(
          citizen._id,
          "citizen",
          "ASSOCIATE_ACCEPTED",
          "Delegation Accepted",
          `${accepter.email.split("@")[0]} has accepted your delegation invitation.`,
          { associateId: accepter._id, associateName: accepter.email.split("@")[0] },
          "info",
          randomInt(1, 3)
        ));
      }

      // INVITATION_EXPIRING_SOON
      if (Math.random() < 0.2) {
        notifications.push(createNotif(
          citizen._id,
          "citizen",
          "INVITATION_EXPIRING_SOON",
          "Delegation Invitation Expiring Soon",
          "Your pending delegation invitation will expire in 48 hours.",
          { expiresAt: new Date(Date.now() + 2 * 86400000) },
          "warning",
          randomInt(0, 1)
        ));
      }
    }

    // 4. Smart alerts for planners
    console.log("Creating smart alert notifications...");
    for (const planner of planners) {
      if (policies.length > 0) {
        const policy = randomItem(policies);

        // VOTE_SURGE
        if (Math.random() < 0.4) {
          notifications.push(createNotif(
            planner._id,
            "planner",
            "VOTE_SURGE",
            "Vote Surge Detected",
            `Policy "${policy.title}" is experiencing a significant increase in voting activity.`,
            { 
              policyId: policy._id, 
              policyTitle: policy.title,
              surgePercentage: randomInt(150, 300),
              timeWindow: "last 24 hours"
            },
            "warning",
            randomInt(0, 2)
          ));
        }

        // RATING_DROP
        if (Math.random() < 0.3) {
          notifications.push(createNotif(
            planner._id,
            "planner",
            "RATING_DROP",
            "Rating Drop Alert",
            `Policy "${policy.title}" has experienced a significant drop in ratings.`,
            { 
              policyId: policy._id, 
              policyTitle: policy.title,
              averageRating: 2.3,
              previousRating: 3.8
            },
            "critical",
            randomInt(0, 3)
          ));
        }

        // EMERGING_TOPIC
        if (Math.random() < 0.3) {
          notifications.push(createNotif(
            planner._id,
            "planner",
            "EMERGING_TOPIC",
            "Emerging Topic Detected",
            `A new topic is trending in comments for "${policy.title}": healthcare access.`,
            { 
              policyId: policy._id, 
              policyTitle: policy.title,
              topic: "healthcare access",
              frequency: 23
            },
            "info",
            randomInt(0, 2)
          ));
        }
      }
    }

    // 5. Planner request notifications
    console.log("Creating planner request notifications...");
    const pendingCitizens = citizens.slice(0, 3);
    for (const citizen of pendingCitizens) {
      // PLANNER_REQUEST_CREATED (to admin)
      if (admin) {
        notifications.push(createNotif(
          admin._id,
          "admin",
          "PLANNER_REQUEST_CREATED",
          "New Planner Request",
          `${citizen.email} has submitted a request to become a planner.`,
          { 
            userId: citizen._id, 
            userEmail: citizen.email,
            requestId: new mongoose.Types.ObjectId()
          },
          "info",
          randomInt(1, 5)
        ));
      }

      // PLANNER_APPROVED (to citizen)
      if (Math.random() < 0.3) {
        notifications.push(createNotif(
          citizen._id,
          "citizen",
          "PLANNER_APPROVED",
          "Planner Request Approved",
          "Congratulations! Your request to become a planner has been approved.",
          { approvedBy: admin?._id },
          "info",
          randomInt(0, 2)
        ));
      }
    }

    // 6. Message notifications
    console.log("Creating message notifications...");
    for (const citizen of citizens.slice(0, 6)) {
      if (Math.random() < 0.4) {
        const sender = randomItem([...citizens, ...planners]);
        notifications.push(createNotif(
          citizen._id,
          "citizen",
          "MESSAGE_RECEIVED",
          "New Message",
          `You have a new message from ${sender.email.split("@")[0]}.`,
          { 
            senderId: sender._id, 
            senderName: sender.email.split("@")[0],
            messagePreview: "Hi, I wanted to discuss the recent policy..."
          },
          "info",
          randomInt(0, 5)
        ));
      }
    }

    // Insert all notifications
    console.log(`\nInserting ${notifications.length} notifications...`);
    await Notification.insertMany(notifications);

    // Summary
    const totalNotifs = await Notification.countDocuments();
    const unreadNotifs = await Notification.countDocuments({ read: false });
    const byType = await Notification.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log("\n========== NOTIFICATION SEED COMPLETE ==========");
    console.log(`Total notifications: ${totalNotifs}`);
    console.log(`Unread notifications: ${unreadNotifs}`);
    console.log("\nNotifications by type:");
    byType.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });
    console.log("===============================================\n");

    await mongoose.disconnect();
    console.log("Disconnected.");
  } catch (err) {
    console.error("Error seeding notifications:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedNotifications();
