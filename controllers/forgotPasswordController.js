const crypto = require("crypto");
const sendResetEmail = require("../utils/emails/resetPasswordMail"); 
const UserModel = require("../models/User");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save hashed token & expiry to DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiry
    await user.save();

    // Send email with link (frontend page)
    const resetUrl = `https://erranzo.onrender.com/reset-password/${resetToken}`;
    await sendResetEmail(user.email, resetUrl);

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { forgotPassword };
