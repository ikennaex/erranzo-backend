// Authentication middleware
const ErrandModel = require("../models/Errand");
const UserModel = require("../models/User");
const CorporateEmployeeModel = require("../models/CorporateEmployee");
require("dotenv").config();

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
    const loggedInUserId = req.user.id; // from token
    const userId = req.params.id; // from URL params

    const userDoc = await UserModel.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare IDs safely
    if (userDoc._id.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const checkErrandOwnership = async (req, res, next) => {
  try {
    const errandId = req.params.id; // the errand being edited
    const loggedInUserId = req.user.id; // user from auth token

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
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.userType !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Admin token is not valid", Error: error });
  }
};

const corporateAuth = (
  requiredRoles = [],
) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const employee =
        await CorporateEmployeeModel.findOne({
          userId,
          status: "active",
        }).populate("corporateAccountId");

      if (!employee) {
        return res.status(403).json({
          message:
            "You do not belong to an active corporate account",
        });
      }

      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(employee.role)
      ) {
        return res.status(403).json({
          message:
            "You do not have permission to perform this action",
        });
      }

      if (
        !employee.corporateAccountId ||
        employee.corporateAccountId.status !==
          "active"
      ) {
        return res.status(403).json({
          message:
            "Corporate account is not active",
        });
      }

      req.corporateEmployee = employee;

      req.corporateAccount =
        employee.corporateAccountId;

      next();
    } catch (error) {
      console.error(
        "Corporate auth error:",
        error,
      );

      return res.status(500).json({
        message:
          "Corporate authorization failed",
      });
    }
  };
};


module.exports = { authToken, checkOwnership, checkErrandOwnership, adminAuth, corporateAuth };
