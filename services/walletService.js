const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.creditWallet = async (userId, amount, paymentIntentId) => {
  await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { upsert: true }
  );

  await Transaction.create({
    userId,
    type: "deposit",
    amount,
    currency: "CAD",
    status: "completed",
    stripePaymentIntentId: paymentIntentId,
  });
};