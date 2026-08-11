const cron = require("node-cron");

const RecurringScheduleModel =
  require("../models/RecurringSchedule");

const UserModel =
  require("../models/User");

const {
  sendPushNotification,
} = require("../notifications/notificationService");


const sendRecurringReminders = async () => {
  const now = new Date();

  const twentyFourHours =
    new Date(
      now.getTime() +
        24 * 60 * 60 * 1000
    );

  const twentyFiveHours =
    new Date(
      now.getTime() +
        25 * 60 * 60 * 1000
    );

  const schedules =
    await RecurringScheduleModel.find({
      status: "active",

      nextRunAt: {
        $gte: twentyFourHours,
        $lte: twentyFiveHours,
      },
    });

  for (const schedule of schedules) {
    try {
      const user =
        await UserModel.findById(
          schedule.userId
        ).select(
          "pushToken firstName"
        );

      if (!user?.pushToken) {
        continue;
      }

      await sendPushNotification(
        user.pushToken,
        "Upcoming recurring errand",
        {
          recurringScheduleId:
            schedule._id.toString(),

          type:
            "recurring_errand_reminder",
        }
      );

    } catch (error) {
      console.error(
        "Recurring reminder error:",
        error
      );
    }
  }
};


// EVERY HOUR

cron.schedule(
  "0 * * * *",
  async () => {
    console.log(
      "Running recurring reminder job..."
    );

    await sendRecurringReminders();
  }
);


module.exports = {
  sendRecurringReminders,
};