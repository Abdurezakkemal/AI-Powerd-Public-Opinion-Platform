const User = require("../models/User");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
const {
  hashPassword,
  comparePassword,
  hashPhone,
  generateOTP,
} = require("../utils/helpers");

exports.register = async (req, res) => {
  try {
    const { email, password, phone, region } = req.body;
    if (!email || !password || !phone || !region) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({
      $or: [{ email }, { phoneHash: hashPhone(phone) }],
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Email or phone already registered" });
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
    });
    await user.save();

    res
      .status(201)
      .json({ message: "User created. Please verify phone with OTP." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone required" });

    const normalized = phone.replace(/^\+251|^0?/, "");
    const key = `otp:${normalized}`;

    const attempts = await client.get(`otp:attempts:${normalized}`);
    if (attempts && parseInt(attempts) >= 3) {
      return res
        .status(429)
        .json({ message: "Too many OTP requests. Try later." });
    }

    const otp = generateOTP();
    await client.setEx(key, 300, otp);

    await client.incr(`otp:attempts:${normalized}`);
    await client.expire(`otp:attempts:${normalized}`, 3600);

    console.log(`OTP for ${normalized}: ${otp}`); // TODO: replace with actual SMS sending

    res.json({ message: "OTP sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code)
      return res.status(400).json({ message: "Phone and code required" });

    const normalized = phone.replace(/^\+251|^0?/, "");
    const key = `otp:${normalized}`;
    const stored = await client.get(key);
    if (!stored || stored !== code) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await client.del(key);

    const phoneHash = hashPhone(phone);
    const user = await User.findOne({ phoneHash });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.verified = true;
    await user.save();

    // Include region in JWT payload
    const token = jwt.sign(
      { id: user._id, role: user.role, region: user.region },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // Include region in JWT payload
    const token = jwt.sign(
      { id: user._id, role: user.role, region: user.region },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
