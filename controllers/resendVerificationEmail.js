const UserModel = require("../models/User");
const sendVerificationMail = require("../utils/emails/sendVerificationMail");

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        message: "Email already verified",
      });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    // send email (do not crash if it fails)
    try {
      await sendVerificationMail({
        email: user.email,
        verificationCode,
      });
    } catch (err) {
      console.error("Email sending failed:", err.message);

      return res.status(500).json({
        message:
          "Failed to send verification email. Please try again.",
      });
    }

    return res.status(200).json({
      message: "New verification email sent",
    });
  } catch (err) {
    console.error("Error resending verification email:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = { resendVerificationEmail };