const User = require("../models/User");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
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

    return sendSuccess(
      res,
      { userId: user._id },
      "User registered successfully. A 6-digit OTP has been sent to your phone for verification.",
      201,
    );
  } catch (err) {
    console.error("Registration error:", err);
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
    console.log(`[SIMULATED SMS] OTP for ${normalized}: ${otp}`);

    return sendSuccess(
      res,
      null,
      "OTP sent successfully. It expires in 5 minutes.",
    );
  } catch (err) {
    console.error("Send OTP error:", err);
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
    console.error("OTP verification error:", err);
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
      return sendError(
        res,
        ErrorCodes.INVALID_CREDENTIALS,
        "Invalid email or password.",
        null,
        401,
      );
    }

    if (!user.active) {
      return sendError(
        res,
        ErrorCodes.ACCOUNT_DISABLED,
        "Your account has been deactivated. Please contact an administrator.",
        null,
        403,
      );
    }
    if (!user.verified) {
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

    return sendSuccess(
      res,
      { token, role: user.role, userId: user._id },
      "Login successful.",
      200,
    );
  } catch (err) {
    console.error("Login error:", err);
    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Login failed. Please try again later.",
      null,
      500,
    );
  }
};
