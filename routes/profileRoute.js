const express = require('express')
const { authToken, checkOwnership } = require('../middleware/auth');
const { editProfile, getProfile } = require('../controllers/profileController');
const router = express.Router()

router.get("/", authToken, getProfile)
router.patch("/", authToken, checkOwnership, editProfile)

module.exports = router;
