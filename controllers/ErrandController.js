const { default: mongoose } = require("mongoose");
const ErrandModel = require("../models/Errand");
const {
  sendNotification,
} = require("../utils/notifications/errandnotification");
const UserModel = require("../models/User");

const {
  sendPushNotification,
  TEMPLATES,
} = require("../notifications/notificationService");

const postErrand = async (req, res) => {
  const {
    title,
    description,
    budget,
    deadline,
    category,
    location,
    status,
    priority,
  } = req.body;

  try {
    const newErrand = await ErrandModel.create({
      title,
      description,
      budget,
      deadline,
      category,
      location,
      status,
      priority,
      poster_id: req.user.id,
    });

    const erranzers = await UserModel.find({
      role: "erranzer",
      pushToken: { $exists: true, $ne: null },
      _id: { $ne: req.user.id },
    }).select("pushToken");

    console.log(`Found ${erranzers.length} erranzers to notify`);

    if (erranzers.length > 0) {
      const tokens = erranzers.map((e) => e.pushToken);
      await sendPushNotification(
        tokens,
        TEMPLATES.ERRAND_POSTED(newErrand.title),
        { errandId: newErrand._id.toString(), type: "errand_posted" },
      );
    }

    await sendNotification({
      recipientId: "all",
      senderId: req.user.id,
      errandId: newErrand._id,
      type: "errand_posted",
      message: `${req.user.name || "Someone"} just posted a new errand: ${
        newErrand.title
      }`,
    });

    res.status(200).json({ message: "Errand posted successfully", newErrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to post errand", error: error.message });
  }
};

const getAllErrands = async (req, res) => {
  try {
    const errands = await ErrandModel.find();
    res
      .status(200)
      .json({ message: "All errands fetched successfully", errands });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch errands", error: error.message });
  }
};

const getQuickErrands = async (req, res) => {
  try {
    const errands = await ErrandModel.find({
      priority: "urgent",
      status: "open",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    res
      .status(200)
      .json({ message: "Quick errands fetched successfully", errands });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch quick errands", error: err.message });
  }
};

const getErrandById = async (req, res) => {
  const { id } = req.params;

  try {
    const errand = await ErrandModel.findById(id);
    if (!errand) {
      return res.status(404).json({ message: "Errand not found" });
    }
    res.status(200).json({ message: "Errand fetched successfully", errand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch errand", error: error.message });
  }
};

const deleteErrand = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedErrand = await ErrandModel.findByIdAndDelete(id);
    if (!deletedErrand) {
      return res.status(404).json({ message: "Errand not found" });
    }
    res
      .status(200)
      .json({ message: "Errand deleted successfully", deletedErrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete errand", error: error.message });
  }
};

const editErrand = async (req, res) => {
  const { id } = req.params;
  const { title, description, budget, deadline, category, location, priority } =
    req.body;

  try {
    // validate ID before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid errand ID" });
    }
    const allowedUpdates = {
      title,
      description,
      budget,
      deadline,
      category,
      location,
      priority,
    };

    // remove undefined fields so they won’t overwrite existing values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(
        ([_, value]) => value !== undefined,
      ),
    );

    const updatedErrand = await ErrandModel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        budget,
        deadline,
        category,
        location,
        priority,
      },
      { new: true, runValidators: true },
    );

    if (!updatedErrand) {
      return res.status(404).json({ message: "Errand not found" });
    }
    res
      .status(200)
      .json({ message: "Errand updated successfully", errand: updatedErrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update errand", error: error.message });
  }
};

const assignErrand = async (req, res) => {
  const { id } = req.params;
  const erranzer_id = req.user.id;

  try {
    const errand = await ErrandModel.findById(id);
    if (!errand) {
      return res.status(404).json({ message: "Errand not found" });
    }
    // save to DB
    errand.erranzer_id = erranzer_id;
    errand.status = "in_progress";

    const poster = errand.poster_id;
    const erranzer = errand.erranzer_id;

    const user = await UserModel.findById(poster);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //change erranzer to erranzer name
    if (user?.pushToken) {
      await sendPushNotification(
        user.pushToken,
        TEMPLATES.ERRAND_ACCEPTED(user.firstName, errand.title),
        { errandId: errand._id, type: "errand_accepted" },
      );
    }

    await errand.save();

    await sendNotification({
      recipientId: errand.poster_id,
      senderId: erranzer_id,
      errandId: errand._id,
      type: "errand_accepted",
      message: `Your errand "${errand.title}" has been assigned to an erranzer.`,
    });

    res.status(200).json({
      message: "This errand has been assigned to you successfully",
      errand,
    });
  } catch (err) {
    console.error("Error assigning errand:", err);
    res
      .status(500)
      .json({ message: "Failed to assign errand", error: err.message });
  }
};

const markCompleted = async (req, res) => {
  const { id } = req.params;
  // id of whoever is making the request
  const userId = req.user.id;
  try {
    const errand = await ErrandModel.findById(id);
    if (!errand) {
      return res.status(404).json({ message: "Errand not found" });
    }

    if (errand.poster_id.toString() === userId.toString()) {
      errand.posterCompleted = true;
    } else if (errand.erranzer_id.toString() === userId.toString()) {
      errand.erranzerCompleted = true;
    } else {
      return res.status(500).json({ message: "User not authorized" });
    }

    if (errand.posterCompleted && errand.erranzerCompleted) {
      errand.status = "completed";
    }

    const poster = errand.poster_id;
    const erranzer = errand.erranzer_id;

    const user = await UserModel.findById(poster);
    const erranzerUser = await UserModel.findById(erranzer);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //change erranzer to erranzer name

    

    await errand.save();

    const latestErrand = await ErrandModel.findById(id);

    if (latestErrand.posterCompleted && latestErrand.erranzerCompleted) {
      if (erranzerUser?.pushToken) {
        await sendPushNotification(
          erranzerUser.pushToken,
          TEMPLATES.ERRAND_COMPLETED_ERRANZER(latestErrand.title),
          { errandId: errand._id, type: "errand_completed" },
        );
      }
      if (user?.pushToken) {
        await sendPushNotification(
          user.pushToken,
          TEMPLATES.ERRAND_COMPLETED_POSTER(latestErrand.title),
          { errandId: errand._id, type: "errand_completed" },
        );
      }
    } else if (latestErrand.posterCompleted && !latestErrand.erranzerCompleted) {
      if (erranzerUser?.pushToken) {
        await sendPushNotification(
          erranzerUser.pushToken,
          TEMPLATES.ERRAND_PRE_COMPLETED(
            latestErrand.title,
            `${erranzerUser.firstName} ${erranzerUser.lastName}`,
          ),
          { errandId: errand._id, type: "errand_completed" },
        );
      }
    } else if (!latestErrand.posterCompleted && latestErrand.erranzerCompleted) {
      if (user?.pushToken) {
        await sendPushNotification(
          user.pushToken,
          TEMPLATES.ERRAND_PRE_COMPLETED(
            latestErrand.title,
            `${user.firstName} ${user.lastName}`,
          ),
          { errandId: errand._id, type: "errand_completed" },
        );
      }
    }
    res
      .status(200)
      .json({ message: "Marked as completed successfully", errand });
  } catch (err) {
    console.error("Error Updating errand:", err);
    res
      .status(500)
      .json({ message: "Failed to complete errand", error: err.message });
  }
};

module.exports = {
  postErrand,
  assignErrand,
  getAllErrands,
  getErrandById,
  deleteErrand,
  editErrand,
  getQuickErrands,
  markCompleted,
};
