const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const hashPhone = (phone) => {
  // Normalize phone: remove +251, leading zero, keep digits
  const normalized = phone.replace(/^\+251|^0?/, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  hashPassword,
  comparePassword,
  hashPhone,
  generateOTP,
};
