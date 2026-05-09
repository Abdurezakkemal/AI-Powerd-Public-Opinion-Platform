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
};

module.exports = limiters;
