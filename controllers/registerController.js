const sendVerificationMail = require("../utils/emails/sendVerificationMail");
const UserModel = require("../models/User");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  try {
    const {
      username,
      email,
      phoneNumber,
      password,
      firstName,
      lastName,
      province,
    } = req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ username }, { email }, { phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
        console.log("Username already exists");
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
        console.log("Email already exists");
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ message: "Phone number already exists" });
        console.log("Phone number already exists");
      }
    }

    const hashPass = await bcrypt.hash(password, 10);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const userDoc = await UserModel.create({
      username,
      email,
      phoneNumber,
      password: hashPass,
      firstName,
      lastName,
      province,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
      isEmailVerified: false,
    });

    // try sending email (but don't fail registration if it fails)
    try {
      await sendVerificationMail({
        email: userDoc.email,
        verificationCode,
      });
    } catch (err) {
      console.error("Email sending failed:", err.message);
      // DO NOT delete user
      // resend endpoint will handle this
    }

    return res.status(201).json({
      message:
        "Check your email for the verification code. If you don't see it, you can request a resend.",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register };
