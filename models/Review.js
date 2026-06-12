const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    errandId: {
      type: Schema.Types.ObjectId,
      ref: "Errand",
      required: true,
    },

    erranzerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true },
);

const ReviewModel = mongoose.model("Review", reviewSchema);
module.exports = ReviewModel;
