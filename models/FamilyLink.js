const mongoose = require("mongoose");
const { Schema } = mongoose;

const familyLinkSchema = new Schema(
  {
    guardianId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seniorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "revoked"],
      default: "pending",
    },

    relationship: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

familyLinkSchema.index(
  {
    guardianId: 1,
    seniorId: 1,
  },
  {
    unique: true,
  }
);

const FamilyLinkModel =
  mongoose.model(
    "FamilyLink",
    familyLinkSchema
  );

module.exports = FamilyLinkModel;