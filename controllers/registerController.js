const sendVerificationMail = require("../emails/sendVerificationMail");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/User");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  const { username, email, phoneNumber, password, firstName, lastName } =
    req.body;

  // check if username or email already exists
  const usernameExists = await UserModel.findOne({ username });
  if (usernameExists) {
    return res.status(400).json({ message: "Username already exists" });
  }

  // check if email already exists
  const emailExists = await UserModel.findOne({ email });
  if (emailExists) {
    return res.status(400).json({ message: "Email already exists" });
  }

  // check if phone number already exists
  const phoneNumberExists = await UserModel.findOne({ phoneNumber });
  if (phoneNumberExists) {
    return res.status(400).json({ message: "Phone number already exists" });
  }

  try {
    // password hash
    const hassPass = await bcrypt.hash(password, 10);

    const userDoc = await UserModel.create({
      username,
      email,
      phoneNumber,
      password: hassPass,
      firstName,
      lastName,
    });

    // create JWT Token
    const token = jwt.sign({userId:userDoc._id, email: userDoc.email}, process.env.JWT_SECRET, {
      expiresIn: "3h", 
    });

    // verify URL
    const verifyURL = `http://localhost:4000/auth/verify-email/${token}`;

    // send verification email
    await sendVerificationMail(email, verifyURL);


    return res
      .status(201)
      .json({ message: "User registered successfully check your email to verify your account" });

  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register };
