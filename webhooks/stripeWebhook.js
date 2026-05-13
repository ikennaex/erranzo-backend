const stripe = require("../config/stripe");
const walletService = require("../services/walletService");

exports.handleStripeWebhook = async (req, res) => {
  const event = req.body;

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;

    const userId = intent.metadata.userId;
    const amount = intent.amount / 100;

    await walletService.creditWallet(userId, amount, intent.id);
  }

  res.json({ received: true });
};