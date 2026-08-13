const mongoose = require("mongoose");
const { Schema } = mongoose;

const recurringScheduleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    templateErrandId: {
      type: Schema.Types.ObjectId,
      ref: "Errand",
      default: null,
    },

    frequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      required: true,
    },

    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
    },

    dayOfMonth: {
      type: Number,
      min: 1,
      max: 28,
      default: null,
    },

    timeOfDay: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    nextRunAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
    },

    onBehalfOf: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    preferredErranzerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    totalOccurrences: {
      type: Number,
      default: 0,
    },

    maxOccurrences: {
      type: Number,
      default: null,
    },

    errandTemplate: {
      title: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        required: true,
      },

      budget: {
        type: Number,
        required: true,
      },
      deadline: {
        type: String,
        required: true,
      },

      category: {
        type: String,
        enum: [
          "delivery",
          "handyman",
          "groceries",
          "transport",
          "home-cleaning",
          "errand-runner",
          "caregiver",
          "other",
        ],
        required: true,
      },

      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
        },

        coordinates: {
          type: [Number],
          required: true,
        },
      },

      address: {
        type: String,
        required: true,
      },

      priority: {
        type: String,
        enum: ["normal", "urgent"],
        default: "normal",
      },
    },
  },
  {
    timestamps: true,
  },
);

recurringScheduleSchema.index({
  status: 1,
  nextRunAt: 1,
});

const RecurringScheduleModel = mongoose.model(
  "RecurringSchedule",
  recurringScheduleSchema,
);

module.exports = RecurringScheduleModel;
