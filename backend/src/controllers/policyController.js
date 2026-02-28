const Policy = require("../models/Policy");
const User = require("../models/User"); // only needed if you decide to fetch user, but we now have region in token

// Helper to generate policy code (can be placed in utils)
const generatePolicyCode = (title) => {
  const prefix = title
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 4)
    .toUpperCase();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${random}`;
};

exports.getAll = async (req, res) => {
  try {
    const { status, region, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    // If user is citizen, only show active policies in their region
    if (req.user.role === "citizen") {
      filter.status = "active";
      filter.targetRegions = req.user.region; // region from JWT
    } else {
      // For planner/admin, allow filtering by region if provided
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
        averageRating: 0, // placeholder until feedback is implemented
        totalVotes: 0,
      })),
      total,
      page: Number(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id).populate(
      "createdBy",
      "email",
    );
    if (!policy) return res.status(404).json({ message: "Policy not found" });

    // Citizens can only view if active and in their region
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, targetRegions, startDate, endDate } = req.body;
    if (!title || !description || !targetRegions || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const policyCode = generatePolicyCode(title);
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
      message: "Policy created.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

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
    res.json(policy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: "Policy not found" });

    if (policy.status === "draft") {
      await policy.deleteOne();
      res.json({ message: "Policy deleted" });
    } else if (policy.status === "active") {
      policy.status = "closed";
      await policy.save();
      res.json({ message: "Policy closed" });
    } else {
      res.status(400).json({ message: "Policy already closed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
