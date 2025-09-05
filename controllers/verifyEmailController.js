const jwt = require("jsonwebtoken");
const UserModel = require("../models/User");

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)

    // find user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check if already verified
    if (user.isVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    // mark as verified
    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("Error verifying email:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Verification link expired. Please request a new one." });
    }

    return res.status(400).json({ message: "Invalid or malformed token" });
  }
};

module.exports = { verifyEmail };
