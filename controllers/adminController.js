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



module.exports = { adminGetAllErrands, getTotalErranzers, getTotalUsers, getUserDetails, getErranzerDetails };
