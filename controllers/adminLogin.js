const jwt = require("jsonwebtoken");
const AdminModel = require("../models/Admin");
const bcrypt = require("bcrypt");

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminDoc = await AdminModel.findOne({ email }).select("+password");

    if (!adminDoc) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, adminDoc.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect Password" });

    const accessToken = jwt.sign(
      { id: adminDoc._id, email: adminDoc.email, userType: "Admin" }, // userType added to payload
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: adminDoc._id, email: adminDoc.email, userType: "Admin" }, 
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token in DB
    adminDoc.refreshToken = refreshToken;
    await adminDoc.save();

    // Send refresh token in HttpOnly cookie
    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = {
      email: adminDoc.email,
      createdAt: adminDoc.createdAt,
      updatedAt: adminDoc.updatedAt,
    };

    res.status(200).json({
      message: "Login successful",
      adminAccessToken: accessToken,
      userType: "Admin",
      admin: safeUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in", Error: err });
  }
};

const adminLogout = async (req, res) => {
  try {
    const token = req.cookies.adminRefreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const admin = await AdminModel.findById(decoded.id);

        if (admin) {
          admin.refreshToken = null; // clear refresh token from DB
          await admin.save();
        }
      } catch (err) {
        console.erorr(
          "Invalid or expired refresh token during logout:",
          err.message
        );
      }
    }

    res.clearCookie("adminRefreshToken", {
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

const adminRegister = async (req, res) => {
    try {
        const {email, password, username} = req.body

        const hashPass = await bcrypt.hash(password, 10); 
        await AdminModel.create({email, password:hashPass, username})

        res.status(200).json({message: "Admin Created Successfully"})
    } catch (err) {
        console.error(err)
    }
}

module.exports = { adminLogin, adminLogout, adminRegister };
