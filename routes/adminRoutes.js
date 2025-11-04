const express = require('express')
const { adminGetAllErrands, getTotalUsers, getTotalErranzers } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');
const router = express.Router()

router.get("/errands", adminAuth, adminGetAllErrands)
router.get("/users", adminAuth, getTotalUsers)
router.get("/aerranzers", adminAuth, getTotalErranzers)

module.exports = router;
