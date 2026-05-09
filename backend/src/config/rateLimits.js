const createRateLimiter = require("../middleware/rateLimiter");

const limiters = {
  // Global: 100 per 15 min per IP
  global: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyPrefix: "rl:global",
  }),

  // Auth (login, register): 10 per 15 min per IP
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: "rl:auth",
  }),

  // OTP request: 3 per hour per IP
  otpRequest: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyPrefix: "rl:otp:request",
  }),

  // OTP verification: 5 per 15 min per IP
  otpVerify: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: "rl:otp:verify",
  }),

  // Password reset request: 3 per hour per IP
  passwordResetRequest: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyPrefix: "rl:password:reset:request",
  }),

  // Password reset confirmation: 5 per 15 min per IP
  passwordResetConfirm: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: "rl:password:reset:confirm",
  }),

  // Voting: 30 per hour per user (key uses user.id)
  vote: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 30,
    keyPrefix: "rl:vote",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),

  // Comments: 10 per minute per user
  comment: createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: "rl:comment",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),

  // Planner request: 1 per day per user
  plannerRequest: createRateLimiter({
    windowMs: 24 * 60 * 60 * 1000,
    max: 1,
    keyPrefix: "rl:planner:request",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
  // Report comment: 5 per minute per user
  reportComment: createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    keyPrefix: "rl:report:comment",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),

  // Appeal comment: 3 per day per user
  appealComment: createRateLimiter({
    windowMs: 24 * 60 * 60 * 1000,
    max: 3,
    keyPrefix: "rl:appeal:comment",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),

  // Moderate comment: 30 per minute per user (planners/admin only)
  moderateComment: createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    keyPrefix: "rl:moderate:comment",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
  phoneChangeRequest: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyPrefix: "rl:phone:request",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
};

module.exports = limiters;
