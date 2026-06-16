const mongoose = require("mongoose");
const { Schema } = mongoose;

const errandSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: String, required: true },
    deadline: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "delivery",
        "handyman",
        "groceries",
        "transport",
        "home-cleaning",
        "errand-runner",
        "caregiver",
        "other",
      ],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "completed"],
      default: "open",
      required: true,
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["held", "released", "refunded"],
      default: "held",
    },
    erranzer_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    poster_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    posterCompleted: { type: Boolean, default: false },
    erranzerCompleted: { type: Boolean, default: false },
    disputeStatus: {
      type: String,
      enum: ["none", "open", "resolved"],
      default: "none",
    },
  },
  { timestamps: true },
);

errandSchema.index({ location: "2dsphere" });

const ErrandModel = mongoose.model("Errand", errandSchema);

module.exports = ErrandModel;
