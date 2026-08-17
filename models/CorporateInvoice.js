const mongoose = require("mongoose");
const { Schema } = mongoose;

const corporateInvoiceSchema = new Schema(
  {
    corporateAccountId: {
      type: Schema.Types.ObjectId,
      ref: "CorporateAccount",
      required: true,
    },

    periodStart: {
      type: Date,
      required: true,
    },

    periodEnd: {
      type: Date,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    lineItems: [
      {
        errandId: {
          type: Schema.Types.ObjectId,
          ref: "Errand",
          required: true,
        },

        employeeUserId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        amount: {
          type: Number,
          required: true,
        },

        description: {
          type: String,
          default: "",
        },

        completedAt: {
          type: Date,
          required: true,
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "draft",
        "sent",
        "paid",
        "overdue",
      ],
      default: "draft",
    },

    stripeInvoiceId: {
      type: String,
      default: null,
    },

    pdfUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

corporateInvoiceSchema.index({
  corporateAccountId: 1,
  periodStart: 1,
  periodEnd: 1,
});

module.exports = mongoose.model(
  "CorporateInvoice",
  corporateInvoiceSchema,
);