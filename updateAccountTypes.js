const mongoose = require("mongoose");
const UserModel = require("./models/User");

require("dotenv").config();

const updateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    const result = await UserModel.updateMany(
      { accountType: { $exists: false } },
      { $set: { accountType: "standard" } }
    );

    console.log("Update complete:");
    console.log(result);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Update failed:", error);
    process.exit(1);
  }
};

updateUsers();