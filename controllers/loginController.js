const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user
    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Create tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" } //
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // long-lived
    );

    // Refrsh token saved in DB 
    user.refreshToken = refreshToken;
    await user.save();

    // Send refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send access token in response
    const { password: _, refreshToken: __, ...safeUser } = user.toObject(); // this removes password and refreshToken to be sent to frontend
    res.json({ message: "Login successful", user: safeUser, accessToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const getLoggedUserProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

module.exports = { login, getLoggedUserProfile };
