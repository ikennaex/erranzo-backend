// utils/notifications/errandNotification.js
const NotificationModel = require("../../models/Notification");
const { getIO } = require("../../config/socket");

/**
 * Send a real-time + stored notification
 * @param {Object} data
 * @param {string | 'all'} data.recipientId - The user receiving the notification, or 'all' to broadcast
 * @param {string} data.senderId - The user sending it
 * @param {string} data.errandId - The errand related to the event
 * @param {string} data.type - Type of notification (e.g. 'errand_accepted')
 * @param {string} data.message - Message text for the recipient
 */
const sendNotification = async (data) => {
  try {
    const { recipientId, senderId, errandId, type, message } = data;
    const io = getIO();

    let newNotification = null;

    // Save to database only if it's not a broadcast
    if (recipientId !== "all") {
      newNotification = await NotificationModel.create({
        recipientId,
        senderId,
        errandId,
        type,
        message,
      });
    }

    // Broadcast to everyone if recipientId === "all"
    if (recipientId === "all") {
      io.emit("notification", {
        senderId,
        errandId,
        type,
        message,
        time: new Date(),
      });
      // console.log("Broadcasted notification to all users");
    } else {
      // Otherwise, send only to the specific recipient
      io.to(recipientId.toString()).emit("notification", newNotification);
      // console.log(`Notification sent to user ${recipientId}: ${message}`);
    }

    return newNotification;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = { sendNotification };
