const { default: mongoose } = require("mongoose");
const ErrandModel = require("../models/Errand");
const {
  sendNotification,
} = require("../utils/notifications/errandnotification");

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
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
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
      { new: true, runValidators: true }
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

module.exports = {
  postErrand,
  assignErrand,
  getAllErrands,
  getErrandById,
  deleteErrand,
  editErrand,
  getQuickErrands,
};
