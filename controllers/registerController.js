const sendVerificationMail = require("../emails/sendVerificationMail");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/User");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  try {
    const { username, email, phoneNumber, password, firstName, lastName, province } =
      req.body;

    // check if username or email or phone number already exists
    const existingUser = await UserModel.findOne({
      $or: [{ username }, { email }, { phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    // password hash
    const hashPass = await bcrypt.hash(password, 10);

    const userDoc = await UserModel.create({
      username,
      email,
      phoneNumber,
      password: hashPass,
      firstName,
      lastName,
      province
    });

    // create JWT Token
    const token = jwt.sign(
      { userId: userDoc._id, email: userDoc.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "3h",
      }
    );

    // verify URL
    const verifyURL = `http://localhost:4000/auth/verify-email/${token}`;

    // send verification email
    await sendVerificationMail(email, verifyURL);

    return res.status(201).json({
      message:
        "User registered successfully check your email to verify your account",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register };
