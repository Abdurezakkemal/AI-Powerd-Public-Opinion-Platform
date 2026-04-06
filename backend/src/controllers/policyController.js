// src/controllers/policyController.js
const Policy = require("../models/Policy");
const User = require("../models/User");
const { customAlphabet } = require("nanoid");

// Nanoid generator: 6 characters, uppercase letters + digits
const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

/**
 * Generate unique policy code with title prefix and random string
 * @param {string} title - Policy title
 * @returns {string} - Policy code
 */
const generatePolicyCode = (title) => {
  const prefix = title
    .replace(/[^a-zA-Z0-9]/g, "") // remove special chars
    .substring(0, 4)
    .toUpperCase();
  const id = nanoid();
  return `${prefix}${id}`;
};

/**
 * Get all policies with optional filters and pagination
 */
exports.getAll = async (req, res) => {
  try {
    const { status, region, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (req.user.role === "citizen") {
      filter.status = "active";
      filter.targetRegions = req.user.region;
    } else {
      if (region) filter.targetRegions = region;
    }

    const policies = await Policy.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("createdBy", "email");

    const total = await Policy.countDocuments(filter);

    res.json({
      policies: policies.map((p) => ({
        id: p._id,
        title: p.title,
        description: p.description,
        policyCode: p.policyCode,
        targetRegions: p.targetRegions,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        averageRating: 0,
        totalVotes: 0,
      })),
      total,
      page: Number(page),
    });
  } catch (err) {
    console.error("Get all policies error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get single policy by ID
 */
exports.getOne = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id).populate(
      "createdBy",
      "email",
    );
    if (!policy) return res.status(404).json({ message: "Policy not found" });

    if (req.user.role === "citizen") {
      if (
        policy.status !== "active" ||
        !policy.targetRegions.includes(req.user.region)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json({
      id: policy._id,
      title: policy.title,
      description: policy.description,
      policyCode: policy.policyCode,
      targetRegions: policy.targetRegions,
      startDate: policy.startDate,
      endDate: policy.endDate,
      status: policy.status,
      createdBy: policy.createdBy.email,
      createdAt: policy.createdAt,
    });
  } catch (err) {
    console.error("Get policy error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create new policy with unique policy code
 */
exports.create = async (req, res) => {
  try {
    const { title, description, targetRegions, startDate, endDate } = req.body;
    if (!title || !description || !targetRegions || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    // Ensure unique policy code
    let policyCode;
    let exists;
    let attempts = 0;
    do {
      policyCode = generatePolicyCode(title);
      exists = await Policy.findOne({ policyCode });
      attempts++;
      if (attempts > 10) {
        return res
          .status(500)
          .json({ message: "Unable to generate unique policy code" });
      }
    } while (exists);

    const policy = new Policy({
      title,
      description,
      targetRegions,
      policyCode,
      startDate,
      endDate,
      status: "draft",
      createdBy: req.user.id,
    });

    await policy.save();
    res.status(201).json({
      id: policy._id,
      policyCode,
      message: "Policy created successfully",
    });
  } catch (err) {
    console.error("Policy creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update existing draft policy
 */
exports.update = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    if (policy.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft policies can be edited" });
    }

    const { title, description, targetRegions, startDate, endDate } = req.body;
    if (title) policy.title = title;
    if (description) policy.description = description;
    if (targetRegions) policy.targetRegions = targetRegions;
    if (startDate) policy.startDate = startDate;
    if (endDate) policy.endDate = endDate;

    await policy.save();
    res.json({
      id: policy._id,
      title: policy.title,
      description: policy.description,
      policyCode: policy.policyCode,
      targetRegions: policy.targetRegions,
      startDate: policy.startDate,
      endDate: policy.endDate,
      status: policy.status,
    });
  } catch (err) {
    console.error("Policy update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete or close policy
 */
exports.delete = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    // console.log("=== DEBUG DELETE POLICY ===");
    // console.log("REQ USER ID:", req.user.id);
    // console.log("POLICY CREATED BY:", policy.createdBy.toString());
    // console.log("ROLE:", req.user.role);
    // console.log("===========================");
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    // 🔒 Ownership / Admin check
    const ownerId = policy.createdBy.toString();
    const userId = req.user.id.toString();

    if (req.user.role !== "admin" && ownerId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ✅ Draft → delete permanently
    if (policy.status === "draft") {
      await policy.deleteOne();
      return res.json({ message: "Policy deleted" });
    }

    // ✅ Active → close only
    if (policy.status === "active") {
      policy.status = "closed";
      await policy.save();
      return res.json({ message: "Policy closed" });
    }

    // ❌ Already closed
    return res.status(400).json({ message: "Policy already closed" });
  } catch (err) {
    console.error("Policy delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
