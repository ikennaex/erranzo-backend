const UserModel = require("../models/User");

const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const user = await UserModel.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier },
        { username: identifier },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // check already verified
    if (user.isEmailVerified) { 
      return res.status(200).json({
        message: "Account already verified",
      });
    }

    // check OTP match
    if (!user.emailVerificationCode || user.emailVerificationCode !== otp) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    // check expiry (10 minutes rule)
    const isExpired =
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date();

    if (isExpired) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    // mark verified
    user.isEmailVerified = true;

    // clear OTP fields
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Account verified successfully.",
    });
  } catch (err) {
    console.error("OTP verification error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = { verifyOtp };