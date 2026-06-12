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
const WalletModel = require("../models/Wallet");

// post errand has wallet debit with escrow and also a transaction
const postErrand = async (req, res) => {
  const {
    title,
    description,
    budget,
    deadline,
    category,
    location,
    coordinates,
    address,
    status,
    priority,
  } = req.body;

  try {
    // balance check
    const wallet = await WalletModel.findOne({
      userId: req.user.id,
    });

    if (!wallet || wallet.balance < budget) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
      });
    }

    // create errand
    const newErrand = await ErrandModel.create({
      title,
      description,
      budget,
      deadline,
      category,
      location,
      coordinates,
      address,
      status,
      priority,
      poster_id: req.user.id,
    });

    // notify erranzers
    const erranzers = await UserModel.find({
      role: "erranzer",
      pushToken: { $exists: true, $ne: null },
      _id: { $ne: req.user.id },
    }).select("pushToken");

    if (erranzers.length > 0) {
      const tokens = erranzers.map((e) => e.pushToken);

      await sendPushNotification(
        tokens,
        TEMPLATES.ERRAND_POSTED(newErrand.title),
        {
          errandId: newErrand._id.toString(),
          type: "errand_posted",
        },
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

    res.status(200).json({
      message: "Errand posted successfully",
      newErrand,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to post errand",
      error: error.message,
    });
  }
};

const getAllErrands = async (req, res) => {
  try {
    const { search, lat, lng, radius = 25 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Geospatial filter
    const hasLocationFilter = lat && lng;

    if (hasLocationFilter) {
      const radiusInMeters = Number(radius) * 1000;

      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    const errands = await ErrandModel.find(query);

    res.status(200).json({
      message: "All errands fetched successfully",
      count: errands.length,
      errands,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch errands",
      error: error.message,
    });
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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const erranzer_id = req.user.id;

    // find errand
    const errand = await ErrandModel.findById(id).session(session);

    if (!errand) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        message: "Errand not found",
      });
    }

    // prevent double assignment
    if (errand.erranzer_id) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Errand already assigned",
      });
    }

    // poster wallet
    const wallet = await WalletModel.findOne({
      userId: errand.poster_id,
    }).session(session);

    // validate balance again
    if (!wallet || wallet.balance < errand.budget) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Poster has insufficient wallet balance",
      });
    }

    // HOLD FUNDS for escrow - debit from poster wallet and move to pending
    wallet.balance -= errand.budget;
    wallet.pending += errand.budget;

    await wallet.save({ session });

    // assign errand
    errand.erranzer_id = erranzer_id;
    errand.status = "in_progress";

    await errand.save({ session });

    // commit transaction
    await session.commitTransaction();
    session.endSession();

    // notifications AFTER successful transaction
    const posterUser = await UserModel.findById(errand.poster_id);

    const erranzerUser = await UserModel.findById(erranzer_id);

    if (!posterUser) {
      return res.status(404).json({
        error: "Poster not found",
      });
    }

    if (!erranzerUser) {
      return res.status(404).json({
        error: "Erranzer not found",
      });
    }

    if (posterUser?.pushToken) {
      await sendPushNotification(
        posterUser.pushToken,
        TEMPLATES.ERRAND_ACCEPTED(
          `${erranzerUser.firstName} ${erranzerUser.lastName}`,
          errand.title,
        ),
        {
          errandId: errand._id.toString(),
          type: "errand_accepted",
        },
      );
    }

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
    await session.abortTransaction();
    session.endSession();

    console.error("Error assigning errand:", err);

    res.status(500).json({
      message: "Failed to assign errand",
      error: err.message,
    });
  }
};

const markCompleted = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const userId = req.user.id;

    // find errand
    const errand = await ErrandModel.findById(id).session(session);

    if (!errand) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        message: "Errand not found",
      });
    }

    // prevent duplicate completion e
    if (errand.status === "completed") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Errand already completed",
      });
    }

    const isPoster = errand.poster_id.toString() === userId.toString();

    const isErranzer = errand.erranzer_id.toString() === userId.toString();

    // authorization
    if (!isPoster && !isErranzer) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        message: "User not authorized",
      });
    }

    // mark completion
    if (isPoster) {
      errand.posterCompleted = true;
    }

    if (isErranzer) {
      errand.erranzerCompleted = true;
    }

    // BOTH USERS COMPLETED
    if (errand.posterCompleted && errand.erranzerCompleted) {
      // poster wallet
      const posterWallet = await WalletModel.findOne({
        userId: errand.poster_id,
      }).session(session);

      // erranzer wallet
      const erranzerWallet = await WalletModel.findOne({
        userId: errand.erranzer_id,
      }).session(session);

      if (!posterWallet || !erranzerWallet) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          message: "Wallet not found",
        });
      }

      // remove escrow hold
      posterWallet.pending -= errand.budget;

      // platform fee example (10%)
      const platformFee = errand.budget * 0.1;

      // erranzer payout
      const payout = errand.budget - platformFee;

      // credit erranzer
      erranzerWallet.balance += payout;

      // save wallets
      await posterWallet.save({ session });
      await erranzerWallet.save({ session });

      // mark payment released
      errand.paymentReleased = true;

      // mark errand completed
      errand.status = "completed";
    }

    // save errand
    await errand.save({ session });

    // commit transaction
    await session.commitTransaction();
    session.endSession();

    // users
    const posterUser = await UserModel.findById(errand.poster_id);

    const erranzerUser = await UserModel.findById(errand.erranzer_id);

    // notifications
    if (errand.posterCompleted && errand.erranzerCompleted) {
      if (erranzerUser?.pushToken) {
        await sendPushNotification(
          erranzerUser.pushToken,
          TEMPLATES.ERRAND_COMPLETED_ERRANZER(errand.title),
          {
            errandId: errand._id.toString(),
            type: "errand_completed",
          },
        );
      }

      if (posterUser?.pushToken) {
        await sendPushNotification(
          posterUser.pushToken,
          TEMPLATES.ERRAND_COMPLETED_POSTER(errand.title),
          {
            errandId: errand._id.toString(),
            type: "errand_completed",
          },
        );
      }
    } else if (isPoster && !errand.erranzerCompleted) {
      if (erranzerUser?.pushToken) {
        await sendPushNotification(
          erranzerUser.pushToken,
          TEMPLATES.ERRAND_PRE_COMPLETED(
            errand.title,
            `${posterUser.firstName} ${posterUser.lastName}`,
          ),
          {
            errandId: errand._id.toString(),
            type: "errand_pre_completed",
          },
        );
      }
    } else if (isErranzer && !errand.posterCompleted) {
      if (posterUser?.pushToken) {
        await sendPushNotification(
          posterUser.pushToken,
          TEMPLATES.ERRAND_PRE_COMPLETED(
            errand.title,
            `${erranzerUser.firstName} ${erranzerUser.lastName}`,
          ),
          {
            errandId: errand._id.toString(),
            type: "errand_pre_completed",
          },
        );
      }
    }

    res.status(200).json({
      message: "Marked as completed successfully",
      errand,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error Updating errand:", err);

    res.status(500).json({
      message: "Failed to complete errand",
      error: err.message,
    });
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
