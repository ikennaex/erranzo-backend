const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatSchema = new Schema({
  errandId: { type: mongoose.Schema.Types.ObjectId, ref: "Errand", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ErrandChatModel = mongoose.model("ErrandChat", chatSchema);
module.exports = ErrandChatModel;
