const mongoose = require("mongoose");
const { Schema } = mongoose;

const disputeSchema = new Schema(
  {
    errandId: {
      type: Schema.Types.ObjectId,
      ref: "Errand",
      required: true,
    },

    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

const DisputeModel = mongoose.model("Dispute", disputeSchema);

module.exports = DisputeModel;