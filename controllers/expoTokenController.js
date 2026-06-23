const UserModel = require("../models/User");

const saveExpoToken = async (req, res) => {
    try {
        const {pushToken} = req.body
        const userId = req.user.id

        if (pushToken === undefined) {
            return res.status(400).json({ error: "Push token is required" });
        }

        const user = await UserModel.findById(userId)

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.pushToken = pushToken
        await user.save()

        return res.status(200).json({ message: "Push token saved successfully" });
    } catch (err) {
        console.error("Error saving Push token:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {saveExpoToken}