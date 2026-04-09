const { Expo } = require("expo-server-sdk");
const expo = new Expo();

// Predefined notification templates
const TEMPLATES = {
  ERRAND_POSTED: (errandTitle) => ({
    title: "New Errand Posted",
    body: `"${errandTitle}" is now live and accepting applicants.`,
    channelId: "errands",
  }),
  ERRAND_ACCEPTED: (erranzerName, errandTitle) => ({
    title: "Errand Accepted!",
    body: `${erranzerName} has accepted your errand "${errandTitle}".`,
    channelId: "errands",
  }),
  ERRAND_COMPLETED: (errandTitle) => ({
    title: "Errand Completed",
    body: `"${errandTitle}" has been marked as completed. Your wallet will be credited shortly. `,
    channelId: "errands",
  }),
  ERRAND_APPLIED: (applicantName, errandTitle) => ({
    title: "New Application",
    body: `${applicantName} applied for your errand "${errandTitle}".`,
    channelId: "errands",
  }),
  NEW_MESSAGE: (senderName) => ({
    title: `${senderName} sent you a message 💬`,
    body: "Tap to view the conversation.",
    channelId: "chat",
  }),
  PAYMENT_RECEIVED: (amount) => ({
    title: "Payment Received",
    body: `$${amount} CAD has been added to your wallet.`,
    channelId: "payments",
  }),
  PAYMENT_SENT: (amount) => ({
    title: "Payment Sent",
    body: `$${amount} CAD has been sent successfully.`,
    channelId: "payments",
  }),
};

// Core send function
async function sendPushNotification(pushTokens, template, data = {}) {
  // pushTokens can be a single string or array
  const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

  const messages = tokens
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      sound: "default",
      title: template.title,
      body: template.body,
      data, // extra data for deep linking
      channelId: template.channelId || "errands", // Android channel
      badge: 1, // iOS badge count
    }));

  if (messages.length === 0) return;

  // Send in chunks (Expo limit is 100 per request)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.error("Push notification error:", err);
    }
  }

  return tickets;
}

// Custom promotional notification
async function sendPromotionalNotification(pushTokens, title, body, data = {}) {
  const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

  const messages = tokens
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      sound: null, // silent for promos
      title,
      body,
      data: { ...data, type: "promotional" },
      channelId: "promotions",
      badge: 0,
    }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error("Promo notification error:", err);
    }
  }
}

module.exports = { sendPushNotification, sendPromotionalNotification, TEMPLATES };