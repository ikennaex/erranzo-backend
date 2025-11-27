const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const AdminModel = mongoose.model("Admin", AdminSchema);
module.exports = AdminModel;
