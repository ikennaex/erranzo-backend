const Wallet = require("../models/Wallet");

const getWallet = async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.params.userId });

  res.json(wallet);
};

module.exports = { getWallet };