const UserModel = require("../models/User");

const editProfile = async (req, res) => {
  const id = req.user.id;
  try {
    const { province, username, firstName, lastName } = req.body;
    const userDoc = await UserModel.findById(id);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) userDoc.username = username;
    if (province) userDoc.province = province;
    if (firstName) userDoc.firstName = firstName;
    if (lastName) userDoc.lastName = lastName;

    await userDoc.save();

    res.status(200).json({ message: "User records updated successfully" , user: userDoc});
  } catch (err) {
    console.err(err);
    res.status(500).json({ message: "User records update failed", error: err.message });
  }
};

const getProfile = async (req, res) => {
    const id = req.user.id;
    try {
        const userDoc = await UserModel.findById(id);

        if (!userDoc) {
            return res.status(404).json({ message: "User not found" });
        } 
        res.status(200).json({ user: userDoc });  
    } catch (err) {
        console.err(err);
        res.status(500).json({ message: "Failed to fetch user profile", error: err.message });
    }
}

module.exports = { editProfile, getProfile };
