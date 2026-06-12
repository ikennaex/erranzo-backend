const express = require('express');
const { authToken } = require('../middleware/auth');
const { generateToken } = require('../controllers/callController');

const router = express.Router();

router.post("/token", authToken, generateToken);

module.exports = router;
