const mongooose = require("mongoose");
const { Schema } = mongooose;

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const AdminModel = mongooose.model("Admin", AdminSchema);
module.exports = AdminModel;
