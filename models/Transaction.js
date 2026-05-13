const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema(
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["deposit", "withdrawal"], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "CAD" },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  stripePaymentIntentId: { type: String },
  createdAt: { type: Date, default: Date.now }
},
  { timestamps: true }
);

const TransactionModel = mongoose.model("Transaction", transactionSchema);
module.exports = TransactionModel;