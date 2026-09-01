const express = require('express')
const router = express.Router()
const { login, getLoggedUserProfile, refreshTokenHandler, logout, mobileLogin, verifyOtp, mobileVerifyOtp } = require('../controllers/loginController');
const { authToken } = require('../middleware/auth');
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many login attempts, please try again later"
  }
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many verification attempts, please try again later"
  }
});

router.post('/signin', loginLimiter, login);
router.post('/mobile-signin', loginLimiter, mobileLogin);
router.post('/signin/verify-otp', verifyOtpLimiter, verifyOtp);
router.post('/mobile-signin/verify-otp', verifyOtpLimiter, mobileVerifyOtp);
router.get('/profile', authToken, getLoggedUserProfile);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);

module.exports = router;
