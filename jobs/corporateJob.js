const cron = require("node-cron");

const CorporateAccountModel =
  require("../models/CorporateAccount");

const CorporateEmployeeModel =
  require("../models/CorporateEmployee");

const resetCorporateMonthlySpend =
  async () => {
    try {
      console.log(
        "Resetting corporate monthly spend...",
      );

      await CorporateAccountModel.updateMany(
        {},
        {
          $set: {
            currentMonthSpend: 0,
          },
        },
      );

      await CorporateEmployeeModel.updateMany(
        {},
        {
          $set: {
            currentMonthSpend: 0,
          },
        },
      );

      console.log(
        "Corporate monthly spend reset complete",
      );
    } catch (error) {
      console.error(
        "Corporate monthly reset error:",
        error,
      );
    }
  };

// 00:00 on the first day of every month
cron.schedule(
  "0 0 1 * *",
  resetCorporateMonthlySpend,
);

module.exports = {
  resetCorporateMonthlySpend,
};