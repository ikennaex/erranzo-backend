const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://erranzo.onrender.com"
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // console.log("User connected:", socket.id);

    socket.on("join_room", (userId) => {
      socket.join(userId);
      // console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      // console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };
