const express = require('express')
const { authToken, checkErrandOwnership } = require('../middleware/auth');
const { getChat, getUserChats } = require('../controllers/chatController');
const router = express.Router()

router.get("/", authToken, getChat)
router.get("/errands", authToken, getUserChats)


module.exports = router;
