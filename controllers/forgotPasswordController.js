const crypto = require("crypto");
const sendResetEmail = require("../utils/emails/resetPasswordMail");
const UserModel = require("../models/User");

const NEUTRAL_RESET_MESSAGE =
  "If an account exists for this email, we've sent a password reset link.";

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (user) {
      // Generate token
      const resetToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Save hashed token & expiry to DB
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

      await user.save();

      // Reset password URL
      const resetUrl = `https://erranzo.com/reset-password/${resetToken}`;

      // Send reset email through Resend
      try {
        await sendResetEmail({
          email: user.email,
          resetUrl,
        });
      } catch (mailErr) {
        console.error("Failed to send reset email:", mailErr);
      }
    }

    // Always return identical status and neutral message regardless of user existence
    return res.status(200).json({
      message: NEUTRAL_RESET_MESSAGE,
    });
  } catch (error) {
    console.error("Error in forgot password:", error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = { forgotPassword };