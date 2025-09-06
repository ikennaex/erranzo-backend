// Authentication middleware 
const UserModel = require("../models/User");
require('dotenv').config();

const jwt = require("jsonwebtoken");

const authToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log("Decoded JWT:", decoded);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};



// A user can only update their own profile.

const checkOwnership = async (req, res, next) => {
  try {
    const userId = req.params.id; // e.g. /users/:id
    const loggedInUserId = req.user._id;

    if (userId !== loggedInUserId) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { authToken, checkOwnership };
