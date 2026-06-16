const mongoose = require("mongoose");
const { Schema } = mongoose;

const erranzerApplicationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bio: {
      type: String,
      required: true,
      maxlength: 500,
    },

    phone: {
      type: String,
    },

    skills: {
      type: [String],
      required: true,
    },

    availability: {
      days: {
        type: [String],
        required: true,
      },
    },

    frontIdUrl: {
      type: String,
      required: true,
    },

    backIdUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const ErranzerApplicationModel = mongoose.model(
  "ErranzerApplication",
  erranzerApplicationSchema,
);

module.exports = ErranzerApplicationModel;
