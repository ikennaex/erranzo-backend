const mongoose = require("mongoose");

const RecurringScheduleModel = require("../models/RecurringSchedule");
const ErrandModel = require("../models/Errand");
const WalletModel = require("../models/Wallet");
const UserModel = require("../models/User");

const calculateNextRun = (schedule, fromDate = new Date()) => {
  const next = new Date(fromDate);

  const [hours, minutes] = schedule.timeOfDay.split(":").map(Number);

  next.setSeconds(0);
  next.setMilliseconds(0);
  next.setHours(hours, minutes, 0, 0);

  if (schedule.frequency === "weekly" || schedule.frequency === "biweekly") {
    const targetDay = schedule.dayOfWeek;

    let daysUntil = (targetDay - next.getDay() + 7) % 7;

    if (daysUntil === 0) {
      daysUntil = schedule.frequency === "biweekly" ? 14 : 7;
    } else if (schedule.frequency === "biweekly") {
      daysUntil += 7;
    }

    next.setDate(next.getDate() + daysUntil);

    return next;
  }

  // MONTHLY

  let year = next.getFullYear();
  let month = next.getMonth();

  if (next.getDate() >= schedule.dayOfMonth) {
    month += 1;
  }

  next.setFullYear(year);
  next.setMonth(month);
  next.setDate(schedule.dayOfMonth);

  next.setHours(hours, minutes, 0, 0);

  return next;
};

const createRecurringErrand = async (schedule) => {
  const template = schedule.errandTemplate;

  const errand = await ErrandModel.create({
    title: template.title,
    description: template.description,
    budget: template.budget,
    deadline: template.deadline,
    category: template.category,

    location: template.location,

    address: template.address,

    priority: template.priority,

    status: "open",

    poster_id: schedule.userId,

    preferredErranzerId: schedule.preferredErranzerId,

    recurringScheduleId: schedule._id,
  });

  return errand;
};

const createRecurringSchedule = async (req, res) => {
  try {
    const {
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      onBehalfOf,
      preferredErranzerId,
      maxOccurrences,
      errandTemplate,
    } = req.body;

    // ==========================================
    // VALIDATE FREQUENCY
    // ==========================================

    if (!["weekly", "biweekly", "monthly"].includes(frequency)) {
      return res.status(400).json({
        message: "Invalid frequency",
      });
    }

    // ==========================================
    // VALIDATE TIME
    // ==========================================

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeOfDay)) {
      return res.status(400).json({
        message: "timeOfDay must be in HH:mm format",
      });
    }

    // ==========================================
    // VALIDATE DAY
    // ==========================================

    if (frequency === "weekly" || frequency === "biweekly") {
      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          message: "dayOfWeek must be between 0 and 6",
        });
      }
    }

    if (frequency === "monthly") {
      if (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 28) {
        return res.status(400).json({
          message: "dayOfMonth must be between 1 and 28",
        });
      }
    }

    // ==========================================
    // VALIDATE TEMPLATE
    // ==========================================

    if (!errandTemplate) {
      return res.status(400).json({
        message: "errandTemplate is required",
      });
    }

    if (!errandTemplate.deadline) {
      return res.status(400).json({
        message: "errandTemplate.deadline is required",
      });
    }r

    // ==========================================
    // CREATE SCHEDULE FIRST
    // ==========================================

    const schedule = await RecurringScheduleModel.create({
      userId: req.user.id,

      frequency,

      dayOfWeek: frequency === "monthly" ? null : dayOfWeek,

      dayOfMonth: frequency === "monthly" ? dayOfMonth : null,

      timeOfDay,

      onBehalfOf: onBehalfOf || null,

      preferredErranzerId: preferredErranzerId || null,

      maxOccurrences: maxOccurrences || null,

      errandTemplate,

      nextRunAt: new Date(),
    });

    // ==========================================
    // CREATE FIRST ERRAND
    // ==========================================

    const firstErrand = await createRecurringErrand(schedule);

    // ==========================================
    // LINK TEMPLATE ERRAND
    // ==========================================

    schedule.templateErrandId = firstErrand._id;

    schedule.totalOccurrences = 1;

    // Calculate next occurrence
    schedule.nextRunAt = calculateNextRun(schedule);

    await schedule.save();

    return res.status(201).json({
      message: "Recurring schedule created successfully",

      schedule,

      firstErrand,
    });
  } catch (error) {
    console.error("Create recurring schedule error:", error);

    return res.status(500).json({
      message: "Failed to create recurring schedule",
      error: error.message,
    });
  }
};

const getRecurringSchedules = async (req, res) => {
  try {
    const filter = {
      userId: req.user.id,
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const schedules = await RecurringScheduleModel.find(filter)
      .populate("preferredErranzerId", "firstName lastName averageRating")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      schedules,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get recurring schedules",
      error: error.message,
    });
  }
};

const getRecurringSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await RecurringScheduleModel.findOne({
      _id: id,
      userId: req.user.id,
    }).populate("preferredErranzerId", "firstName lastName averageRating");

    if (!schedule) {
      return res.status(404).json({
        message: "Recurring schedule not found",
      });
    }

    const errands = await ErrandModel.find({
      recurringScheduleId: schedule._id,
    })
      .populate("erranzer_id", "firstName lastName averageRating")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      schedule,
      errands,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get recurring schedule",
      error: error.message,
    });
  }
};

const updateRecurringSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await RecurringScheduleModel.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!schedule) {
      return res.status(404).json({
        message: "Recurring schedule not found",
      });
    }

    if (schedule.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled schedules cannot be modified",
      });
    }

    const allowedFields = [
      "frequency",
      "dayOfWeek",
      "dayOfMonth",
      "timeOfDay",
      "preferredErranzerId",
      "maxOccurrences",
      "errandTemplate",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        schedule[field] = req.body[field];
      }
    }

    // Recalculate next occurrence
    schedule.nextRunAt = calculateNextRun(schedule);

    await schedule.save();

    return res.status(200).json({
      message: "Recurring schedule updated successfully",

      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update recurring schedule",
      error: error.message,
    });
  }
};

const pauseRecurringSchedule = async (req, res) => {
  try {
    const schedule = await RecurringScheduleModel.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        status: "active",
      },
      {
        $set: {
          status: "paused",
        },
      },
      {
        new: true,
      },
    );

    if (!schedule) {
      return res.status(404).json({
        message: "Active recurring schedule not found",
      });
    }

    return res.status(200).json({
      message: "Recurring schedule paused",
      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to pause recurring schedule",
      error: error.message,
    });
  }
};

const resumeRecurringSchedule = async (req, res) => {
  try {
    const schedule = await RecurringScheduleModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!schedule) {
      return res.status(404).json({
        message: "Recurring schedule not found",
      });
    }

    if (schedule.status !== "paused") {
      return res.status(400).json({
        message: "Only paused schedules can be resumed",
      });
    }

    schedule.status = "active";

    schedule.nextRunAt = calculateNextRun(schedule);

    await schedule.save();

    return res.status(200).json({
      message: "Recurring schedule resumed",

      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to resume recurring schedule",
      error: error.message,
    });
  }
};

const cancelRecurringSchedule = async (req, res) => {
  try {
    const schedule = await RecurringScheduleModel.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        status: {
          $ne: "cancelled",
        },
      },
      {
        $set: {
          status: "cancelled",
        },
      },
      {
        new: true,
      },
    );

    if (!schedule) {
      return res.status(404).json({
        message: "Recurring schedule not found",
      });
    }

    return res.status(200).json({
      message: "Recurring schedule cancelled",
      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel recurring schedule",
      error: error.message,
    });
  }
};

module.exports = {
  createRecurringSchedule,
  getRecurringSchedules,
  getRecurringSchedule,
  updateRecurringSchedule,
  pauseRecurringSchedule,
  resumeRecurringSchedule,
  cancelRecurringSchedule,
  createRecurringErrand,
  calculateNextRun,
};
