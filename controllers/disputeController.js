const DisputeModel = require("../models/Dispute");
const ErrandModel = require("../models/Errand");
const TransactionModel = require("../models/Transaction");
const WalletModel = require("../models/Wallet");

const createDispute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { errandId, reason, description } = req.body;

    // check errand exists
    const errand = await ErrandModel.findById(errandId);

    if (!errand) {
      return res.status(404).json({ message: "Errand not found" });
    }

    // only poster or erranzer can raise dispute
    if (
      errand.poster_id.toString() !== userId &&
      errand.erranzer_id?.toString() !== userId
    ) {
      return res.status(403).json({
        message: "Not allowed to raise dispute for this errand",
      });
    }

    // prevent duplicate disputes
    const existing = await DisputeModel.findOne({
      errandId,
      status: "open",
    });

    if (existing) {
      return res.status(400).json({
        message: "Dispute already open for this errand",
      });
    }

    // create dispute
    await DisputeModel.create({
      errandId,
      raisedBy: userId,
      reason,
      description,
    });

    // update errand status
    errand.disputeStatus = "open";
    await errand.save();

    return res.status(201).json({
      message: "Dispute raised successfully. Our team will review it shortly.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getDisputes = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    const disputes = await DisputeModel.find(query)
      .populate("errandId")
      .populate("raisedBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({ disputes });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch disputes",
      error: error.message,
    });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const dispute = await DisputeModel.findById(id).populate("errandId");

    if (!dispute) {
      return res.status(404).json({
        message: "Dispute not found",
      });
    }

    if (dispute.status === "resolved") {
      return res.status(400).json({
        message: "Already resolved",
      });
    }

    const errand = await ErrandModel.findById(dispute.errandId._id);

    const amount = Number(errand.budget);

    // RELEASE MONEY TO ERRANZER
    if (resolution === "release") {
      const wallet = await WalletModel.findOne({
        userId: errand.erranzer_id,
      });

      if (!wallet) {
        return res.status(404).json({
          message: "Erranzer wallet not found",
        });
      }

      wallet.balance += amount;
      wallet.totalEarned += amount;

      await wallet.save();

      await TransactionModel.create({
        userId: errand.erranzer_id,
        type: "escrow_release",
        amount,
        currency: wallet.currency,
        status: "completed",
        metadata: {
          errandId: errand._id,
          disputeId: dispute._id,
        },
      });
    }

    // REFUND TO POSTER WALLET
    if (resolution === "refund") {
      const wallet = await WalletModel.findOne({
        userId: errand.poster_id,
      });

      if (!wallet) {
        return res.status(404).json({
          message: "Poster wallet not found",
        });
      }

      wallet.balance += amount;

      await wallet.save();

      await TransactionModel.create({
        userId: errand.poster_id,
        type: "deposit",
        amount,
        currency: wallet.currency,
        status: "completed",
        metadata: {
          errandId: errand._id,
          disputeId: dispute._id,
          reason: "dispute_refund",
        },
      });
    }

    dispute.status = "resolved";
    await dispute.save();

    errand.disputeStatus = "resolved";
    await errand.save();

    return res.status(200).json({
      message:
        resolution === "release"
          ? "Funds added to erranzer wallet"
          : "Funds refunded to poster wallet",
    });
  } catch (error) {
    console.log("Resolve dispute error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = { createDispute, getDisputes, resolveDispute };
