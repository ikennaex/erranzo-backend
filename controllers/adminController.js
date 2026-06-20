const ErrandModel = require("../models/Errand");
const UserModel = require("../models/User");

const adminGetAllErrands = async (req, res) => {
  try {
    const errands = await ErrandModel.find({ status: "in_progress" }).populate({
      path: "erranzer_id",
    });
    res.status(200).json({ message: "Fetched errands", errands });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting errands" });
  }
};

// get total users on the site
const getTotalUsers = async (req, res) => {
  try {
    const users = await UserModel.countDocuments({ role: "user" });
    res.status(200).json({ totalUsers: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting users" });
  }
};

// get total erranzers 
const getTotalErranzers = async (req, res) => {
  try {
    const erranzers = await UserModel.countDocuments({role: "erranzer"});
    res.status(200).json({totalErranzers: erranzers});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting erranzers" });
  }
};

// get users details 
const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ role: "user" });
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting user details" });
  }
}

const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting user details" });
  }
}

// get users details 
const getErranzers = async (req, res) => {
  try {
    const erranzers = await UserModel.find({ role: "erranzer", status: "active" });
    res.status(200).json({ erranzers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting erranzer details" });
  }
}

const getErranzerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const erranzer = await UserModel.findById(id);
    if (!erranzer) {
      return res.status(404).json({ message: "Erranzer not found" });
    }
    res.status(200).json({ erranzer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting erranzer details" });
  }
}

const getUnverifiedErranzers = async (req, res) => {
  try {
    const unverifiedErranzers = await UserModel.find({ role: "erranzer", status: "pending" });

    res.status(200).json({ unverifiedErranzers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting unverified erranzers" });
  }
}

const approveorRejectErranzer = async (req, res) => {
  const { id } = req.params;
  const {status} = req.body;

  try {
    const erranzer = await UserModel.findById(id);
    if (!erranzer) {
      return res.status(404).json({ message: "Erranzer not found" });
    }

    if (status === "approved") {
      erranzer.applicationStatus = "approved";
      erranzer.kycStatus = "approved";
      erranzer.role = "erranzer";

      res.status(200).json({ message: "Application approved" });
    }
    else if (status === "rejected") {
      erranzer.applicationStatus = "rejected";
      erranzer.kycStatus = "rejected";
      res.status(200).json({ message: "Application rejected" });
    }

    await erranzer.save();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error approving erranzer" });
  }
}

const userManagemnent = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const erranzer = await UserModel.findById(id);
    if (!erranzer) {
      return res.status(404).json({ message: "Erranzer not found" });
    }

    if (status === "suspended") {
      erranzer.status = "suspended";
      res.status(200).json({ message: "User suspended" });
    }

    else if (status === "active") {
      erranzer.status = "active";
      res.status(200).json({ message: "User activated" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error managing user" });
  }
}

const getAnalytics = async (req, res) => {
  try {
    const { period = "week" } = req.query;

    // Calc date range
    const now = new Date();
    let startDate = new Date();

    if (period === "day") {
      startDate.setDate(now.getDate() - 1);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }


    // NEW USERS (grouped by day)
    const newUsers = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Errand volume
    const errandVolume = await ErrandModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // STATUS BREAKDOWN
    const statusAgg = await ErrandModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusBreakdown = {
      open: 0,
      in_progress: 0,
      completed: 0,
    };

    statusAgg.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    // ang completion time

    const completedErrands = await ErrandModel.find({
      status: "completed",
      updatedAt: { $exists: true },
    });

    let totalHours = 0;

    completedErrands.forEach((errand) => {
      const diff =
        new Date(errand.updatedAt) - new Date(errand.createdAt);

      totalHours += diff / (1000 * 60 * 60);
    });

    const avgCompletionTimeHours =
      completedErrands.length > 0
        ? totalHours / completedErrands.length
        : 0;


    res.status(200).json({
      newUsers,
      errandVolume,
      avgCompletionTimeHours: Number(avgCompletionTimeHours.toFixed(2)),
      statusBreakdown,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};



module.exports = { adminGetAllErrands, getTotalErranzers, getTotalUsers, getUsers, getUserDetails, getErranzers, getErranzerDetails, getUnverifiedErranzers, approveorRejectErranzer, userManagemnent, getAnalytics };
