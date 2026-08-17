const { default: mongoose } = require("mongoose");
const UserModel = require("../models/User");
const ErrandModel = require("../models/Errand");

const getUserProfile = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = (req, res) => {
  // Logic to update user profile
};

const getAllErrandsPosted = async (req, res) => {
  try {
    const {id} = req.user
    const errandDoc = await ErrandModel.find({poster_id: id})

    if (!errandDoc) {
      return res.status(404).json({message: "Errands not found"})
    }

    res.status(200).json({message: "All errands fetched successfully", errandDoc})
  } catch (err) {
    console.error(err)
    res.status(500).json({message: "Error occured while fetching errands", error: err.message})
  }
}

const getAllAcceptedErrands = async (req, res) => {
  try {
    const {id} = req.user
    const errandDoc = await ErrandModel.find({erranzer_id: id})

    if (!errandDoc) {
      return res.status(500).json({message: "Errands accepted not found"})
    }

    return res.status(200).json({message: "Errnads accepted fetched completely", errandDoc})
  } catch (err) {
    console.error(err)
    res.status(500).json({message: "Error occured while fetching errands", error: err.message})
  }
}

const updateAccountType = async (req, res) => {
  try {
    const { id } = req.user;
    const { accountType } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { accountType },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error updating account type:", error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateAccountType,
  getAllErrandsPosted,
  getAllAcceptedErrands
};
