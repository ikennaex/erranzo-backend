const ErrandChatModel = require("../models/ErrandChat");
const mongoose = require("mongoose");

const getUserChats = async (req, res) => {
    const userId = req.user.id
  try {
    const id = new mongoose.Types.ObjectId(userId);

    const chats = await ErrandChatModel.find({
      $or: [{ senderId: id }, { receiverId: id }]
    })
    //   .populate("senderId", "name email") // optional, to get sender info
    //   .populate("receiverId", "name email") // optional, to get receiver info
      .sort({ timestamp: 1 }); // oldest first, use -1 for newest first

    res.status(200).json(chats);
  } catch (error) {
      res.status(500).json({ error: "Error fetching chats" });
    console.error("Error fetching chats:", error);
  }
};


const getChat = async (req, res) => {
  try {
    const messages = await ErrandChatModel.find({
      errandId: req.params.errandId,
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
      res.status(500).json({ error: "Error fetching chats" });
}
};

module.exports = { getChat, getUserChats };
