// const redis = require("redis");

// const client = redis.createClient({ url: process.env.REDIS_URL });

// client.on("error", (err) => console.error("Redis error:", err));
// client.on("connect", () => console.log("Redis connected"));

// // Connect immediately (redis v4+ uses async connect)
// (async () => {
//   await client.connect();
// })();

// module.exports = client;

// In-memory store for development (replace with Redis later)
const otpStore = new Map(); // key: phone number, value: { otp, expires }

const memoryClient = {
  // Store OTP with expiry (in seconds)
  setEx: async (key, seconds, value) => {
    const expires = Date.now() + seconds * 1000;
    otpStore.set(key, { value, expires });
    return "OK";
  },
  // Get OTP
  get: async (key) => {
    const record = otpStore.get(key);
    if (!record) return null;
    if (Date.now() > record.expires) {
      otpStore.delete(key);
      return null;
    }
    return record.value;
  },
  // Delete OTP
  del: async (key) => {
    otpStore.delete(key);
    return 1;
  },
  // For rate limiting (increment and expire)
  incr: async (key) => {
    const val = otpStore.get(key) || { value: 0 };
    val.value += 1;
    otpStore.set(key, val);
    return val.value;
  },
  expire: async (key, seconds) => {
    const record = otpStore.get(key);
    if (record) {
      record.expires = Date.now() + seconds * 1000;
      otpStore.set(key, record);
    }
    return 1;
  },
  // For connection events (no-op)
  on: () => {},
  // Quit (no-op)
  quit: () => {},
};

console.log("Using in-memory OTP store (Redis not available)");

module.exports = memoryClient;
