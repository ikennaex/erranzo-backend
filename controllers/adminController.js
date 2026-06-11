const ErrandModel = require("../models/Errand");
const UserModel = require("../models/User");

const adminGetAllErrands = async (req, res) => {
  try {
    const errands = await ErrandModel.find({ status: "in_progress" }).populate({
      path: "erranzer_id",
    });
    res.status(200).json({ message: "Fetched errands", errands });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting errands" });
  }
};

// get total users on the site
const getTotalUsers = async (req, res) => {
  try {
    const users = await UserModel.countDocuments({ role: "user" });
    res.status(200).json({ totalUsers: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting users" });
  }
};

// get total erranzers 
const getTotalErranzers = async (req, res) => {
  try {
    const erranzers = await UserModel.countDocuments({role: "erranzer"});
    res.status(200).json({totalErranzers: erranzers});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting erranzers" });
  }
};

// get users details 
const getUserDetails = async (req, res) => {
  try {
    const users = await UserModel.find({ role: "user" });
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting user details" });
  }
}

// get users details 
const getErranzerDetails = async (req, res) => {
  try {
    const erranzers = await UserModel.find({ role: "erranzer" });
    res.status(200).json({ erranzers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting erranzer details" });
  }
}

const getUnverifiedErranzers = async (req, res) => {
  try {
    const unverifiedErranzers = await UserModel.find({ role: "erranzer", status: "pending" });
    res.status(200).json({ unverifiedErranzers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting unverified erranzers" });
  }
}

const approveorRejectErranzer = async (req, res) => {
  const { id } = req.params;
  const {status} = req.body;

  try {
    const erranzer = await UserModel.findById(id);
    if (!erranzer) {
      return res.status(404).json({ message: "Erranzer not found" });
    }

    if (status === "approved") {
      erranzer.applicationStatus = "approved";
      erranzer.kycStatus = "approved";
      erranzer.role = "erranzer";

      res.status(200).json({ message: "Application approved" });
    }
    else if (status === "rejected") {
      erranzer.applicationStatus = "rejected";
      erranzer.kycStatus = "rejected";
      res.status(200).json({ message: "Application rejected" });
    }

    await erranzer.save();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error approving erranzer" });
  }
}

const userManagemnent = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const erranzer = await UserModel.findById(id);
    if (!erranzer) {
      return res.status(404).json({ message: "Erranzer not found" });
    }

    if (status === "suspended") {
      erranzer.status = "suspended";
      res.status(200).json({ message: "User suspended" });
    }

    else if (status === "active") {
      erranzer.status = "active";
      res.status(200).json({ message: "User activated" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error managing user" });
  }
}



module.exports = { adminGetAllErrands, getTotalErranzers, getTotalUsers, getUserDetails, getErranzerDetails, getUnverifiedErranzers, approveorRejectErranzer, userManagemnent };
