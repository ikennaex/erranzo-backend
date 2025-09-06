const mongooose = require("mongoose");
const { Schema } = mongooose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, 
  refreshToken: { type: String }
}, { timestamps: true });

const UserModel = mongooose.model("User", userSchema);
module.exports = UserModel;
