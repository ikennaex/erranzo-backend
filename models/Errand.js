const mongoose = require("mongoose");
const { Schema } = mongoose;

const errandSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
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
    isEmergency: {
      type: Boolean,
      default: false,
    },

    emergencySurcharge: {
      type: Number,
      default: 0,
    },

    emergencyExpiresAt: {
      type: Date,
      default: null,
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
    sourceErrandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Errand",
      default: null,
    },
    preferredErranzerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recurringScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringSchedule",
      default: null,
    },
    etaMinutes: {
      type: Number,
      default: null,
    },

    etaUpdatedAt: {
      type: Date,
      default: null,
    },

    erranzerLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  { timestamps: true },
);

errandSchema.index({ location: "2dsphere" });

const ErrandModel = mongoose.model("Errand", errandSchema);

module.exports = ErrandModel;
