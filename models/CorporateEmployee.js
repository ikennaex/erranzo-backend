const mongoose = require("mongoose");
const { Schema } = mongoose;

const corporateEmployeeSchema = new Schema(
  {
    corporateAccountId: {
      type: Schema.Types.ObjectId,
      ref: "CorporateAccount",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },

    individualSpendingLimit: {
      type: Number,
      default: null,
    },

    currentMonthSpend: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "active",
        "suspended",
        "invited",
      ],
      default: "active",
    },

    // Needed for invitations
    inviteToken: {
      type: String,
      default: null,
    },

    inviteExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

corporateEmployeeSchema.index(
  {
    corporateAccountId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model(
  "CorporateEmployee",
  corporateEmployeeSchema,
);