const express = require('express')
const { authToken } = require('../middleware/auth');
const { updateErrandLocation, getErrandEta } = require('../controllers/errandLocationController');
const router = express.Router()


// rate limiting to prevent spamming location updates 
const rateLimit = require("express-rate-limit");

const locationUpdateLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  message: {
    message:
      "Please wait before sending another location update",
  },
});

router.get("/:id/eta", authToken, getErrandEta)
router.post("/:id/location", authToken, locationUpdateLimiter,updateErrandLocation)


module.exports = router;
