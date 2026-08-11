const express = require("express");
const router = express.Router();
const { authToken } = require("../middleware/auth");

const {
  createRecurringSchedule,
  getRecurringSchedules,
  getRecurringSchedule,
  updateRecurringSchedule,
  pauseRecurringSchedule,
  resumeRecurringSchedule,
  cancelRecurringSchedule,
} = require("../controllers/recurringController");

router.post("/", authToken, createRecurringSchedule);
router.get("/", authToken, getRecurringSchedules);
router.get("/:id", authToken, getRecurringSchedule);
router.patch("/:id", authToken, updateRecurringSchedule);
router.patch("/:id/pause", authToken, pauseRecurringSchedule);
router.patch("/:id/resume", authToken, resumeRecurringSchedule);
router.delete("/:id", authToken, cancelRecurringSchedule);

module.exports = router;
