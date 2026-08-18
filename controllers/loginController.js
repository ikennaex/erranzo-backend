const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendLoginOtpMail = require("../utils/emails/sendLoginOtpMail");

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Identifier and password are required" });
    }

    // Find user
    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // 2FA for erranzers
    if (user.role === "erranzer") {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otpCode, 10);
      user.loginOtp = hashedOtp;
      user.loginOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      user.loginOtpAttempts = 0;
      await user.save();

      try {
        await sendLoginOtpMail({ email: user.email, otpCode });
      } catch (err) {
        console.error("Failed to send OTP:", err);
      }

      return res.json({
        requiresOtp: true,
        message: "OTP sent to your registered email",
      });
    }

    // Create tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "30d" }, //
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }, // long-lived
    );

    // Refrsh token saved in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Send refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true only on HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
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

const mobileLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Identifier and password are required" });
    }

    // Find user
    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // 2FA for erranzers
    if (user.role === "erranzer") {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otpCode, 10);
      user.loginOtp = hashedOtp;
      user.loginOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      user.loginOtpAttempts = 0;
      await user.save();

      try {
        await sendLoginOtpMail({ email: user.email, otpCode });
      } catch (err) {
        console.error("Failed to send OTP:", err);
      }

      return res.json({
        requiresOtp: true,
        message: "OTP sent to your registered email",
      });
    }

    // Create tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "30d" }, //
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }, // long-lived
    );

    // Refrsh token saved in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Send access token in response
    const { password: _, refreshToken: __, ...safeUser } = user.toObject();
    res.json({
      message: "Login successful",
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res
        .status(400)
        .json({ message: "Identifier and OTP are required" });
    }

    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate OTP exists and not expired
    if (!user.loginOtp || !user.loginOtpExpires || user.loginOtpExpires < Date.now()) {
      user.loginOtp = null;
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Check attempts
    if (user.loginOtpAttempts >= 5) {
      user.loginOtp = null;
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: "Too many failed attempts. Please login again." });
    }

    const isMatch = await bcrypt.compare(otp.toString(), user.loginOtp);

    if (!isMatch) {
      user.loginOtpAttempts += 1;
      if (user.loginOtpAttempts >= 5) {
         user.loginOtp = null;
         user.loginOtpExpires = null;
         user.loginOtpAttempts = 0;
         await user.save();
         return res.status(400).json({ message: "Too many failed attempts. Please login again." });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Success! Clear OTP
    user.loginOtp = null;
    user.loginOtpExpires = null;
    user.loginOtpAttempts = 0;

    // Create tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "30d" },
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, refreshToken: __, ...safeUser } = user.toObject();
    res.json({ message: "Login successful", user: safeUser, accessToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "An error occurred during verification" });
  }
};

const mobileVerifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res
        .status(400)
        .json({ message: "Identifier and OTP are required" });
    }

    const user = await UserModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate OTP exists and not expired
    if (!user.loginOtp || !user.loginOtpExpires || user.loginOtpExpires < Date.now()) {
      user.loginOtp = null;
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Check attempts
    if (user.loginOtpAttempts >= 5) {
      user.loginOtp = null;
      user.loginOtpExpires = null;
      user.loginOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: "Too many failed attempts. Please login again." });
    }

    const isMatch = await bcrypt.compare(otp.toString(), user.loginOtp);

    if (!isMatch) {
      user.loginOtpAttempts += 1;
      if (user.loginOtpAttempts >= 5) {
         user.loginOtp = null;
         user.loginOtpExpires = null;
         user.loginOtpAttempts = 0;
         await user.save();
         return res.status(400).json({ message: "Too many failed attempts. Please login again." });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Success! Clear OTP
    user.loginOtp = null;
    user.loginOtpExpires = null;
    user.loginOtpAttempts = 0;

    // Create tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "30d" },
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
    );

    user.refreshToken = refreshToken;
    await user.save();

    const { password: _, refreshToken: __, ...safeUser } = user.toObject();
    res.json({
      message: "Login successful",
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "An error occurred during verification" });
  }
};

const refreshTokenHandler = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Refresh token mismatch" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await UserModel.findById(decoded.id);
      if (user) {
        user.refreshToken = null; // clear from DB
        await user.save();
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      path: "/",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};

const getLoggedUserProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, refreshToken, ...safeUser } = user.toObject();
    res.status(200).json(safeUser);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

module.exports = { login, getLoggedUserProfile, refreshTokenHandler, mobileLogin, logout, verifyOtp, mobileVerifyOtp };
