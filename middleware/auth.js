// Authentication middleware 
const ErrandModel = require("../models/Errand");
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
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};



// A user can only update their own profile.

// check later

const checkOwnership = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id;
    const postId = req.params.id

    const errandDoc = ErrandModel.findById(postId)

    if (errandDoc.poster_id !== loggedInUserId) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const checkErrandOwnership = async (req, res, next) => {
  try {
    const errandId = req.params.id;       // the errand being edited
    const loggedInUserId = req.user.id;   // user from auth token

    // find the errand in DB
    const errand = await ErrandModel.findById(errandId);

    if (!errand) {
      return res.status(404).json({ message: "Errand not found" });
    }

    // check if the logged-in user is the owner
    if (errand.poster_id.toString() !== loggedInUserId) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = { authToken, checkOwnership, checkErrandOwnership };
