const User = require("../models/User");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/audit");
const {
  hashPassword,
  comparePassword,
  hashPhone,
  generateOTP,
  normalizePhone,
} = require("../utils/helpers");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

exports.register = async (req, res) => {
  try {
    const { email, password, phone, region } = req.body;
    if (!email || !password || !phone || !region) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Missing required fields: email, password, phone, region are all required",
        { required: ["email", "password", "phone", "region"] },
        400,
      );
    }

    const existing = await User.findOne({
      $or: [{ email }, { phoneHash: hashPhone(phone) }],
    });
    if (existing) {
      const field = existing.email === email ? "Email" : "Phone number";
      return sendError(
        res,
        ErrorCodes.DUPLICATE,
        `${field} already registered. Please use a different ${field.toLowerCase()}.`,
        null,
        409,
      );
    }

    const passwordHash = await hashPassword(password);
    const phoneHash = hashPhone(phone);

    const user = new User({
      email,
      passwordHash,
      phoneHash,
      region,
      role: "citizen",
      verified: false,
      active: true,
    });
    await user.save();

    // Audit: account registration
    await createAuditLog({
      userId: user._id,
      userRole: "citizen",
      action: "REGISTER",
      details: { email, phone: normalizePhone(phone) },
      req,
    });

    logger.info(`User registered: ${email} (${user._id})`);

    return sendSuccess(
      res,
      { userId: user._id },
      "User registered successfully. A 6-digit OTP has been sent to your phone for verification.",
      201,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "Registration error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Unable to complete registration. Please try again later.",
      null,
      500,
    );
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Phone number is required",
        null,
        400,
      );
    }

    const normalized = normalizePhone(phone);
    const key = `otp:${normalized}`;
    const attemptsKey = `otp:attempts:${normalized}`;

    const attempts = await client.get(attemptsKey);
    if (attempts && parseInt(attempts) >= 3) {
      logger.warn(`OTP rate limit exceeded for ${normalized}`);
      return sendError(
        res,
        ErrorCodes.RATE_LIMIT,
        "Too many OTP requests. Please wait 1 hour before requesting again.",
        null,
        429,
      );
    }

    const otp = generateOTP();
    await client.setEx(key, 300, otp);
    await client.incr(attemptsKey);
    await client.expire(attemptsKey, 3600);

    // Simulate SMS – replace with actual gateway
    logger.info(`OTP sent to ${normalized}`); // DO NOT log OTP in production unless debugging
    // For debugging only – remove in production
    if (process.env.NODE_ENV !== "production") {
      logger.debug(`[DEV] OTP for ${normalized}: ${otp}`);
    }

    return sendSuccess(
      res,
      null,
      "OTP sent successfully. It expires in 5 minutes.",
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Send OTP error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Failed to send OTP. Please try again.",
      null,
      500,
    );
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Phone number and verification code are required",
        null,
        400,
      );
    }

    const normalized = normalizePhone(phone);
    const key = `otp:${normalized}`;
    const attemptsKey = `otp:verify:${normalized}`;

    const attempts = await client.incr(attemptsKey);
    if (attempts > 3) {
      logger.warn(`OTP verify rate limit exceeded for ${normalized}`);
      return sendError(
        res,
        ErrorCodes.RATE_LIMIT,
        "Too many verification attempts. Please wait 5 minutes.",
        null,
        429,
      );
    }
    await client.expire(attemptsKey, 300);

    const stored = await client.get(key);
    if (!stored || stored !== code) {
      logger.warn(`Failed OTP verification for ${normalized}`);
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Invalid or expired OTP. Please request a new one.",
        null,
        400,
      );
    }

    await client.del(key);
    await client.del(attemptsKey);

    const phoneHash = hashPhone(phone);
    const user = await User.findOne({ phoneHash });
    if (!user) {
      return sendError(
        res,
        ErrorCodes.NOT_FOUND,
        "No account found with this phone number.",
        null,
        404,
      );
    }

    user.verified = true;
    await user.save();

    // Audit: phone verified
    await createAuditLog({
      userId: user._id,
      userRole: user.role,
      action: "VERIFY_OTP",
      details: { phone: normalized },
      req,
    });

    logger.info(`User verified: ${user.email} (${user._id})`);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        region: user.region,
        verified: user.verified,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return sendSuccess(
      res,
      { token, role: user.role },
      "Phone verified successfully. You can now log in.",
      200,
    );
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack },
      "OTP verification error",
    );
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Verification failed. Please try again.",
      null,
      500,
    );
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "Email and password are required",
        null,
        400,
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Failed login attempt for non-existent email: ${email}`);
      return sendError(
        res,
        ErrorCodes.INVALID_CREDENTIALS,
        "Invalid email or password.",
        null,
        401,
      );
    }

    if (!user.active) {
      logger.warn(`Login attempt for deactivated account: ${email}`);
      return sendError(
        res,
        ErrorCodes.ACCOUNT_DISABLED,
        "Your account has been deactivated. Please contact an administrator.",
        null,
        403,
      );
    }
    if (!user.verified) {
      logger.warn(`Login attempt for unverified account: ${email}`);
      return sendError(
        res,
        ErrorCodes.NOT_VERIFIED,
        "Your phone number is not verified. Please complete OTP verification first.",
        null,
        403,
      );
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      logger.warn(`Failed login attempt for ${email} – wrong password`);
      return sendError(
        res,
        ErrorCodes.INVALID_CREDENTIALS,
        "Invalid email or password.",
        null,
        401,
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        region: user.region,
        verified: user.verified,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Audit: successful login
    await createAuditLog({
      userId: user._id,
      userRole: user.role,
      action: "LOGIN",
      details: { email: user.email },
      req,
    });

    logger.info(`User logged in: ${email} (${user._id})`);

    return sendSuccess(
      res,
      { token, role: user.role, userId: user._id },
      "Login successful.",
      200,
    );
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Login error");
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Login failed. Please try again later.",
      null,
      500,
    );
  }
};
