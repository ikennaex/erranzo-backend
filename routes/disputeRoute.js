const express = require('express')
const { authToken } = require('../middleware/auth')
const { createDispute } = require('../controllers/disputeController')
const router = express.Router()

router.post("/dispute", authToken, createDispute)

module.exports = router;
