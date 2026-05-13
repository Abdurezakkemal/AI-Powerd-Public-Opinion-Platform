const createRateLimiter = require("../middleware/rateLimiter");

const intEnv = (name, fallback) => {
  const value = parseInt(process.env[name], 10);
  return Number.isFinite(value) ? value : fallback;
};

const limiters = {
  // Global dashboard/API traffic. Keep high for active local/admin work.
  global: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: intEnv("RATE_LIMIT_GLOBAL_MAX", 2000),
    keyPrefix: "rl:global",
  }),

  // Auth (login, register)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: intEnv("RATE_LIMIT_AUTH_MAX", 100),
    keyPrefix: "rl:auth",
  }),

  // OTP request
  otpRequest: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: intEnv("RATE_LIMIT_OTP_REQUEST_MAX", 30),
    keyPrefix: "rl:otp:request",
  }),

  // OTP verification
  otpVerify: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: intEnv("RATE_LIMIT_OTP_VERIFY_MAX", 50),
    keyPrefix: "rl:otp:verify",
  }),

  // Password reset request
  passwordResetRequest: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: intEnv("RATE_LIMIT_PASSWORD_RESET_REQUEST_MAX", 30),
    keyPrefix: "rl:password:reset:request",
  }),

  // Password reset confirmation
  passwordResetConfirm: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: intEnv("RATE_LIMIT_PASSWORD_RESET_CONFIRM_MAX", 50),
    keyPrefix: "rl:password:reset:confirm",
  }),

  // Voting
  vote: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: intEnv("RATE_LIMIT_VOTE_MAX", 300),
    keyPrefix: "rl:vote",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),

  // Comments and internal messages
  comment: createRateLimiter({
    windowMs: 60 * 1000,
    max: intEnv("RATE_LIMIT_COMMENT_MAX", 120),
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
    max: intEnv("RATE_LIMIT_REPORT_COMMENT_MAX", 60),
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
    max: intEnv("RATE_LIMIT_MODERATE_COMMENT_MAX", 300),
    keyPrefix: "rl:moderate:comment",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
  phoneChangeRequest: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: intEnv("RATE_LIMIT_PHONE_CHANGE_REQUEST_MAX", 30),
    keyPrefix: "rl:phone:request",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
  bulkAdmin: createRateLimiter({
    windowMs: 60 * 1000,
    max: intEnv("RATE_LIMIT_BULK_ADMIN_MAX", 120),
    keyPrefix: "rl:bulk:admin",
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
};

module.exports = limiters;
