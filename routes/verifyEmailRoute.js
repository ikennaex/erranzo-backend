const express = require('express')
const { verifyEmail, verifyOtp } = require('../controllers/verifyEmailController')
const { resendVerificationEmail } = require('../controllers/resendVerificationEmail')
const router = express.Router()


router.post('/verify-otp', verifyOtp)
router.post('/resend-otp', resendVerificationEmail)

module.exports = router