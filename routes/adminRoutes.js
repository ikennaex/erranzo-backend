const express = require('express')
const { adminGetAllErrands, getTotalUsers, getTotalErranzers, getErranzerDetails, getUserDetails } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');
const router = express.Router()

router.get("/errands", adminAuth, adminGetAllErrands)
router.get("/users", adminAuth, getTotalUsers)
router.get("/erranzers", adminAuth, getTotalErranzers)
router.get("/details/erranzers", adminAuth, getErranzerDetails)
router.get("/details/users", adminAuth, getUserDetails)

module.exports = router;
