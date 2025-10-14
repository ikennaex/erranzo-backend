const express = require("express");
const { sendNotification } = require("../utils/notifications/errandnotification");
// const { sendNotification } = require("../utils/notification");
const router = express.Router();

router.get("/test-notification", async (req, res) => {
  try {
    sendNotification({
      recipientId: "all", // broadcast
      senderId: "system",
      errandId: "demo123",
      type: "test_notification",
      message: "xMotivo Technologies is the best",
    });

    res.json({ success: true, message: "Test notification sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
