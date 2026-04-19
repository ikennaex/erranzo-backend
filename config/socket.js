const { Server } = require("socket.io");
const ErrandChatModel = require("../models/ErrandChat");
const UserModel = require("../models/User");
const { sendPushNotification, TEMPLATES } = require("../notifications/notificationService");

let io;


const activeInChat = new Map();

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
      socket.userId = userId;
    });

    // User opens a chat — mark them as active in that chat
    socket.on("join_errand_chat", (errandId) => {
      socket.join(errandId);
      socket.currentErrandId = errandId;

      if (socket.userId) {
        if (!activeInChat.has(socket.userId)) {
          activeInChat.set(socket.userId, new Set());
        }
        activeInChat.get(socket.userId).add(errandId);
      }
    });

    // User leaves a chat screen
    socket.on("leave_errand_chat", (errandId) => {
      socket.leave(errandId);
      if (socket.userId && activeInChat.has(socket.userId)) {
        activeInChat.get(socket.userId).delete(errandId);
      }
    });

    socket.on("send_message", async (data) => {
      try {
        const newMessage = await ErrandChatModel.create({
          errandId: data.errandId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
        });

        // Real-time message to everyone in the chat room
        io.to(data.errandId).emit("receive_message", newMessage);

        // Real-time notification badge to receiver's personal room
        io.to(data.receiverId).emit("new_message_notification", {
          errandId: data.errandId,
          message: data.message,
          senderId: data.senderId,
        });

        // Push notification — only if receiver is NOT currently viewing this chat
        const receiverIsInChat =
          activeInChat.has(data.receiverId) &&
          activeInChat.get(data.receiverId).has(data.errandId);

        if (!receiverIsInChat) {
          try {
            const [sender, receiver] = await Promise.all([
              UserModel.findById(data.senderId).select("firstName lastName"),
              UserModel.findById(data.receiverId).select("pushToken"),
            ]);

            if (receiver?.pushToken && sender) {
              await sendPushNotification(
                receiver.pushToken,
                TEMPLATES.NEW_MESSAGE(`${sender.firstName} ${sender.lastName}`),
                {
                  chatId: data.errandId,
                  type: "new_message",
                  senderId: data.senderId,
                }
              );
            }
          } catch (notifErr) {
            console.error("Chat push notification error:", notifErr);
          }
        }

      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("message_error", { message: "Failed to send message" });
      }
    });

    // Typing indicators
    socket.on("typing", ({ errandId, senderId }) => {
      socket.to(errandId).emit("user_typing", { senderId });
    });

    socket.on("stopped_typing", ({ errandId, senderId }) => {
      socket.to(errandId).emit("user_stopped_typing", { senderId });
    });

    socket.on("disconnect", () => {
      // Clean up active chat tracking when user disconnects
      if (socket.userId) {
        activeInChat.delete(socket.userId);
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };