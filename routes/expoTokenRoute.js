const express = require('express')
const { authToken } = require('../middleware/auth');
const { saveExpoToken } = require('../controllers/expoTokenController');
const router = express.Router()

router.post("/", authToken, saveExpoToken)

module.exports = router;
