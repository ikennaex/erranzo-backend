const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new Schema(
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  currency: { type: String, default: "CAD" },
  balance: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 }
},
  { timestamps: true }
);

const WalletModel = mongoose.model("Wallet", walletSchema);
module.exports = WalletModel;