const mongoose = require("mongoose");

const errandPhotoSchema = new mongoose.Schema(
  {
    errandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Errand",
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    phase: {
      type: String,
      enum: ["before", "after"],
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

errandPhotoSchema.index({
  errandId: 1,
  phase: 1,
});

const ErrandPhotoModel = mongoose.model("ErrandPhoto", errandPhotoSchema);
module.exports = ErrandPhotoModel;
