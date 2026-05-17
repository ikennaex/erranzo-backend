const stripe = require("../config/stripe");
const TransactionModel = require("../models/Transaction");
const UserModel = require("../models/User");
const WalletModel = require("../models/Wallet");

const createConnectAccount = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    // already exists
    if (user.stripeAccountId) {
      return res.status(400).json({
        message: "Stripe account already exists",
      });
    }

    // create express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "CA",
      email: user.email,
      capabilities: {
        transfers: {
          requested: true,
        },
      },
    });

    // save stripe account ID
    user.stripeAccountId = account.id;

    await user.save();

    // onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://erranzo.com/reauth",
      return_url: "https://erranzo.com/return",
      type: "account_onboarding",
    });

    res.status(200).json({
      url: accountLink.url,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create connect account",
      error: err.message,
    });
  }
};

const withdrawFunds = async (req, res) => {
  const { amount } = req.body;

  try {
    const user = await UserModel.findById(req.user.id);

    if (!user.stripeAccountId) {
      return res.status(400).json({
        message: "Stripe account not connected",
      });
    }

    const wallet = await WalletModel.findOne({
      userId: req.user.id,
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // 1. CREATE TRANSACTION FIRST (pending)
    const transaction = await TransactionModel.create({
      userId: req.user.id,
      type: "withdrawal",
      amount,
      currency: "CAD",
      status: "pending",
    });

    try {
      // 2. RESERVE FUNDS (deduct immediately)
      wallet.balance -= amount;
      await wallet.save();

      // 3. SEND STRIPE TRANSFER
      const transfer = await stripe.transfers.create({
        amount: amount * 100,
        currency: "cad",
        destination: user.stripeAccountId,
      });

      // 4. MARK SUCCESS
      transaction.status = "completed";
      transaction.stripePaymentIntentId = transfer.id;
      await transaction.save();

      return res.status(200).json({
        message: "Withdrawal completed successfully",
        transaction,
      });
    } catch (stripeError) {
      // rollback wallet if Stripe fails
      wallet.balance += amount;
      await wallet.save();

      transaction.status = "failed";
      await transaction.save();

      return res.status(500).json({
        message: "Stripe payout failed",
        error: stripeError.message,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Withdrawal failed",
      error: err.message,
    });
  }
};

module.exports = {
  createConnectAccount, withdrawFunds
};