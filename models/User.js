const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ["user", "erranzer"], default: "user" },
    bio: {},
    description: {},
    wallet: {},
    errandsCreated: {},
    errandsInvolved: {},
    province: { type: String },
    country: { type: String, default: "Canada" },
    pushToken: { type: String },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
