const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async (to, subject, text, html) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

const sendOtpEmail = async (to, otp) => {
  await sendEmail(
    to,
    "Your OTP Code - Civic Engagement Platform",
    `Your verification code is: ${otp}\nIt expires in 5 minutes.`,
    `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`,
  );
};

const sendPasswordResetEmail = async (to, token) => {
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  await sendEmail(
    to,
    "Password Reset Request - Civic Engagement Platform",
    `You requested a password reset. Click the link below to set a new password (valid for 1 hour):\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.`,
    `<p>You requested a password reset. Click the link below to set a new password (valid for 1 hour):</p>
     <p><a href="${resetLink}">${resetLink}</a></p>
     <p>If you didn't request this, please ignore this email.</p>`,
  );
};

const sendAdminInitiatedResetEmail = async (to, token) => {
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  await sendEmail(
    to,
    "Password Reset Initiated by Administrator",
    `An administrator has initiated a password reset for your account. Click the link below to set a new password (valid for 1 hour):\n\n${resetLink}\n\nIf you did not request this, please contact support.`,
    `<p>An administrator has initiated a password reset for your account. Click the link below to set a new password (valid for 1 hour):</p>
     <p><a href="${resetLink}">${resetLink}</a></p>
     <p>If you did not request this, please contact support.</p>`,
  );
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendAdminInitiatedResetEmail,
};
