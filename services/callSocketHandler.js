const { checkCallAuthorization } = require("../utils/callUtils");

/**
 * Tracks active calls
 * Key: userId (string)
 * Value: { channelName: string, peerId: string }
 */
const activeCallMap = new Map();

/**
 * Register Agora audio calling signaling handlers
 * @param {import("socket.io").Server} io 
 * @param {import("socket.io").Socket} socket 
 */
function registerCallHandlers(io, socket) {
  // socket.userId is set during join_room event in socket.js

  socket.on("call:initiate", async (data) => {
    // Expected payload: { callerId, calleeId, callerName, channelName }
    const { callerId, calleeId, callerName, channelName } = data;
    
    // Validate inputs
    if (!callerId || !calleeId || !channelName) {
      console.warn("call:initiate missing fields", data);
      return;
    }

    // 1. Authorization Check
    const isAuthorized = await checkCallAuthorization(callerId, calleeId);
    if (!isAuthorized) {
      socket.emit("call:unauthorized", {
        message: "You can only call erranzers who have accepted your errand"
      });
      return;
    }

    // 2. Busy Check
    if (activeCallMap.has(calleeId)) {
      socket.emit("call:busy", { calleeId });
      return;
    } 
    
    // 3. Forward to the callee as call:incoming
    // The target user has joined a room named after their userId
    io.to(calleeId).emit("call:incoming", {
      callerId,
      calleeId,
      callerName,
      channelName
    });
  });

  socket.on("call:accepted", (data) => {
    // Expected payload: { channelName, callerId }
    const { channelName, callerId } = data;
    const calleeId = socket.userId; // Identified via socket session

    if (!channelName || !callerId || !calleeId) {
      console.warn("call:accepted missing fields", data, "socket.userId:", calleeId);
      return;
    }

    // Add both users to the activeCallMap
    activeCallMap.set(calleeId, { channelName, peerId: callerId });
    activeCallMap.set(callerId, { channelName, peerId: calleeId });

    // Forward to the caller's socket using their room
    io.to(callerId).emit("call:accepted", {
      channelName,
      callerId,
      calleeId
    });
  });

  socket.on("call:rejected", (data) => {
    // Expected payload: { callerId }
    const { callerId } = data;
    const calleeId = socket.userId;
    
    if (!callerId || !calleeId) {
      console.warn("call:rejected missing fields", data, "socket.userId:", calleeId);
      return;
    }

    // Forward to the caller's socket
    io.to(callerId).emit("call:rejected", {
      callerId,
      calleeId
    });
  });

  socket.on("call:ended", (data) => {
    // Expected payload: { channelName, otherUserId }
    const { channelName, otherUserId } = data;
    const myUserId = socket.userId;

    if (!channelName || !otherUserId || !myUserId) {
      console.warn("call:ended missing fields", data, "socket.userId:", myUserId);
      return;
    }

    // Remove both users from the map
    activeCallMap.delete(myUserId);
    activeCallMap.delete(otherUserId);

    // Forward to the other party's socket
    io.to(otherUserId).emit("call:ended", {
      channelName,
      otherUserId: myUserId // notify who ended it
    });
  });
}

/**
 * Clean up active call on socket disconnect
 * @param {import("socket.io").Server} io 
 * @param {import("socket.io").Socket} socket 
 */
function handleCallDisconnect(io, socket) {
  const userId = socket.userId;
  if (userId && activeCallMap.has(userId)) {
    const { channelName, peerId } = activeCallMap.get(userId);
    
    // Clean up both users from the tracking map
    activeCallMap.delete(userId);
    if (peerId) {
      activeCallMap.delete(peerId);
      
      // Notify the peer that the call ended due to disconnect
      io.to(peerId).emit("call:ended", {
        channelName,
        otherUserId: userId
      });
    }
  }
}

module.exports = {
  registerCallHandlers,
  handleCallDisconnect,
  activeCallMap
};
