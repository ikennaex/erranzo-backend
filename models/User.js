const mongooose = require("mongoose");
const { Schema } = mongooose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {type: String, enum: ["user", "erranzer"], default: "user"},
  bio: {},
  description: {},
  wallet: {},
  errandsCreated: {},
  errandsInvolved: {},
  province: {type: String, required: true},
  country: {type: String, default: "Canada"},
  isVerified: { type: Boolean, default: false }, 
  refreshToken: { type: String }
}, { timestamps: true });

const UserModel = mongooose.model("User", userSchema);
module.exports = UserModel;
