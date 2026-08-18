const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "personal";
      },
    },

    type: {
      type: String,
      enum: ["personal", "corporate"],
      default: "personal",
      required: true,
    },

    corporateAccountId: {
      type: Schema.Types.ObjectId,
      ref: "CorporateAccount",
      required: function () {
        return this.type === "corporate";
      },
      default: null,
    },

    currency: {
      type: String,
      default: "CAD",
    },

    balance: {
      type: Number,
      default: 0,
    },

    pending: {
      type: Number,
      default: 0,
    },

    totalEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const WalletModel = mongoose.model("Wallet", walletSchema);
module.exports = WalletModel;
