const bcrypt = require("bcrypt");
const crypto = require("crypto");
const UserModel = require("../models/User");

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Hash the received token to match the stored one
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token and non-expired
    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPass = await bcrypt.hash(password, 10);
    user.password = hashedPass;

    // Clear token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { resetPassword };
