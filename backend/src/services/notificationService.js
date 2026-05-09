const Notification = require("../models/Notification");
const User = require("../models/User");

const createNotification = async ({ userId, type, title, message, data }) => {
  const user = await User.findById(userId);
  if (!user) return;
  const notification = new Notification({
    userId,
    userRole: user.role,
    type,
    title,
    message,
    data,
  });
  await notification.save();
  // Emit via WebSocket if socket.io is running (optional)
  return notification;
};

module.exports = { createNotification };
