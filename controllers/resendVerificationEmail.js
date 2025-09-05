const jwt = require("jsonwebtoken");
const UserModel = require("../models/User");
const sendVerificationMail = require("../emails/sendVerificationMail"); 

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if already verified, no need to resend
    if (user.isVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    // generate a fresh token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const verifyURL = `http://localhost:4000/auth/verify-email/${token}`;

    // send email
    await sendVerificationMail(user.email, verifyURL);

    return res.status(200).json({ message: "New verification email sent" });
  } catch (err) {
    console.error("Error resending verification email:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { resendVerificationEmail };
