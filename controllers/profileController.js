const { default: mongoose } = require("mongoose");
const UserModel = require("../models/User");

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

module.exports = {
  getUserProfile,
  updateUserProfile,
};
