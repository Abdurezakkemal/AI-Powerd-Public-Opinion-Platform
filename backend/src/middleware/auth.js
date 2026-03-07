const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    // Internal service call with API key
    const internalKey = req.header("X-Internal-API-Key");
    if (internalKey && internalKey === process.env.INTERNAL_API_KEY) {
      // Grant admin privileges for internal calls
      req.user = { role: "admin", id: "internal" };
      return next();
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Access denied" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports = authMiddleware;
