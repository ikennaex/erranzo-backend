const cron = require("node-cron");

const RecurringScheduleModel =
  require("../models/RecurringSchedule");

const WalletModel =
  require("../models/Wallet");

const {
  createRecurringErrand,
  calculateNextRun,
} = require("../controllers/recurringController");


const processRecurringSchedules = async () => {
  const now = new Date();

  const schedules =
    await RecurringScheduleModel.find({
      status: "active",
      nextRunAt: {
        $lte: now,
      },
    });

  for (const schedule of schedules) {
    try {
      // CHECK MAX OCCURRENCES

      if (
        schedule.maxOccurrences &&
        schedule.totalOccurrences >=
          schedule.maxOccurrences
      ) {
        await RecurringScheduleModel.findOneAndUpdate(
          {
            _id: schedule._id,
            status: "active",
          },
          {
            $set: {
              status: "cancelled",
            },
          }
        );

        continue;
      }

      // ==========================================
      // CHECK WALLET
      // ==========================================

      const wallet =
        await WalletModel.findOne({
          userId: schedule.userId,
        });

      const budget =
        schedule.errandTemplate.budget;

      if (
        !wallet ||
        wallet.balance < budget
      ) {
        await RecurringScheduleModel.findOneAndUpdate(
          {
            _id: schedule._id,
            status: "active",
          },
          {
            $set: {
              status: "paused",
            },
          }
        );

        // TODO:
        // Send insufficient funds notification

        continue;
      }

      // ATOMIC CLAIM

      const claimed =
        await RecurringScheduleModel.findOneAndUpdate(
          {
            _id: schedule._id,
            status: "active",
            nextRunAt: {
              $lte: now,
            },
          },
          {
            $set: {
              nextRunAt:
                new Date(
                  now.getTime() +
                    60 * 1000
                ),
            },
          },
          {
            new: true,
          }
        );

      if (!claimed) {
        continue;
      }

      // CREATE ERRAND

      await createRecurringErrand(
        claimed
      );

      // CALCULATE NEXT RUN

      const nextRun =
        calculateNextRun(
          claimed,
          now
        );

      // INCREMENT OCCURRENCE

      const newTotal =
        claimed.totalOccurrences + 1;

      const update = {
        totalOccurrences: newTotal,
        nextRunAt: nextRun,
      };

      if (
        claimed.maxOccurrences &&
        newTotal >=
          claimed.maxOccurrences
      ) {
        update.status = "cancelled";
      }

      await RecurringScheduleModel.findOneAndUpdate(
        {
          _id: claimed._id,
        },
        {
          $set: update,
        }
      );

    } catch (error) {
      console.error(
        `Recurring schedule ${schedule._id} failed:`,
        error
      );
    }
  }
};


// EVERY 15 MINUTES

cron.schedule(
  "*/15 * * * *",
  async () => {
    console.log(
      "Running recurring errand job..."
    );

    await processRecurringSchedules();
  }
);


module.exports = {
  processRecurringSchedules,
};