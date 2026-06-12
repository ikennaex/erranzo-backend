const TransactionModel = require("../models/Transaction");
const WalletModel = require("../models/Wallet");

const getWallet = async (req, res) => {
  const wallet = await WalletModel.findOne({ userId: req.user.id });

  res.json(wallet);
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const { type, page = 1, limit = 20 } = req.query;

    const query = { userId };

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const transactions = await TransactionModel.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await TransactionModel.countDocuments(query);

    res.status(200).json({
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

module.exports = { getWallet, getTransactions };