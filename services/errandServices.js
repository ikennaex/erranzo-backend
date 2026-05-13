const Wallet = require("../models/Wallet");

exports.holdFunds = async (userId, amount) => {
  const wallet = await Wallet.findOne({ userId });

  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient balance");
  }

  wallet.balance -= amount;
  wallet.pending += amount;

  await wallet.save();
};