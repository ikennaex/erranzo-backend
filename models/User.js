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
    accountType: {
      type: String,
      enum: ["standard", "senior", "guardian"],
      default: "standard",
    },
    corporateAccountId: {
      type: Schema.Types.ObjectId,
      ref: "CorporateAccount",
      default: null,
    },
    bio: {},
    description: {},
    wallet: {},
    errandsCreated: {},
    errandsInvolved: {},
    stripeCustomerId: { type: String },
    stripeAccountId: { type: String },
    payoutsEnabled: {
      type: Boolean,
      default: false,
    },
    province: { type: String },
    country: { type: String, default: "Canada" },
    pushToken: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "verified"],
      default: "active",
    },
    kycStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    refreshToken: { type: String },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
