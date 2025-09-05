const express = require('express')
const { getUserProfile, updateUserProfile } = require('../controllers/profileController')
const {authToken, checkOwnership} = require('../middleware/auth')
const router = express.Router()

router.get('/:id', getUserProfile)
router.put('/:id', authToken, checkOwnership, updateUserProfile)


module.exports = router 