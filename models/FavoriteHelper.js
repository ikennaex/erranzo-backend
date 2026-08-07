const mongoose = require("mongoose");

const favouriteHelperSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    erranzerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate favourites
favouriteHelperSchema.index(
  {
    userId: 1,
    erranzerId: 1,
  },
  {
    unique: true,
  },
);

const FavouriteHelperModel = mongoose.model("FavouriteHelper", favouriteHelperSchema);
module.exports = FavouriteHelperModel;
