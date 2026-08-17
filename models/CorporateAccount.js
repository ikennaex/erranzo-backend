const mongoose = require("mongoose");
const { Schema } = mongoose;

const corporateAccountSchema = new Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    companyEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    stripeCustomerId: {
      type: String,
      default: null,
    },

    billingEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    monthlySpendingLimit: {
      type: Number,
      default: null,
    },

    currentMonthSpend: {
      type: Number,
      default: 0,
    },

    customPricingTier: {
      type: String,
      enum: ["standard", "silver", "gold", "enterprise"],
      default: "standard",
    },

    platformFeeOverride: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "active",
        "suspended",
        "pending_verification",
      ],
      default: "pending_verification",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "CorporateAccount",
  corporateAccountSchema,
);