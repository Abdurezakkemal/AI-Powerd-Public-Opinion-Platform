const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Internal service call
      const internalKey = req.header("X-Internal-API-Key");
      if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
        req.user = { role: "admin", id: "internal" };
        return next();
      }

      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Access denied" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ FETCH USER FROM DB
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // ✅ ACTIVE CHECK (CRITICAL)
      if (!user.active) {
        return res.status(403).json({ message: "Account disabled" });
      }

      // Role check
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.user = {
        id: user._id,
        role: user.role,
      };

      next();
    } catch (err) {
      console.error(err);
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports = authMiddleware;
