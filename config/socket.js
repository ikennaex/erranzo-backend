const { Server } = require("socket.io");
const ErrandChatModel = require("../models/ErrandChat");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://erranzo.onrender.com",
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_room", (userId) => {
      socket.join(userId);
    });

    // Chat: user joins a specific errand chat room
    socket.on("join_errand_chat", (errandId) => {
      socket.join(errandId);
    });

    // Chat: user sends a message
    socket.on("send_message", async (data) => {
      try {
        const newMessage = await ErrandChatModel.create({
          errandId: data.errandId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
        });

        // 1. Emit message to the errand room (realtime chat for both users)
        io.to(data.errandId).emit("receive_message", newMessage);

        // 2. Emit notification to the receiver (userId-based)
        io.to(data.receiverId).emit("new_message_notification", {
          errandId: data.errandId,
          message: data.message,
          senderId: data.senderId,
        });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };
