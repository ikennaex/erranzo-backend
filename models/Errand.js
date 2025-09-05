const mongooose = require("mongoose");
const { Schema } = mongooose;

const errandSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: String, required: true },
  deadline: { type: String, required: true },
  category: { type: String, enum: ["delivery", "handyman", "groceries", "transport", "home-cleaning", "delivery", "care-giver"], required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ["open", "in_progress", "completed"], default: "pending", required: true },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium", required: true },
  erranzer_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
  poster_id: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true }); 

const ErrandModel = mongooose.model("Errand", errandSchema);

module.exports = ErrandModel;