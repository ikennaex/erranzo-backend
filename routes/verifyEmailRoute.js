const express = require('express')
const { verifyEmail } = require('../controllers/verifyEmailController')
const { resendVerificationEmail } = require('../controllers/resendVerificationEmail')
const router = express.Router()


router.get('/verify-email/:token', verifyEmail)
router.post('/resend-verification', resendVerificationEmail)

module.exports = router