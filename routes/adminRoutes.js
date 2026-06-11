const express = require('express')
const { adminGetAllErrands, getTotalUsers, getTotalErranzers, getErranzerDetails, getUserDetails, getUnverifiedErranzers, approveorRejectErranzer, userManagemnent } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');
const router = express.Router()

router.get("/errands", adminAuth, adminGetAllErrands)
router.get("/users", adminAuth, getTotalUsers)
router.get("/erranzers", adminAuth, getTotalErranzers)
router.get("/pending-erranzers", adminAuth, getUnverifiedErranzers)
router.get("/details/erranzers", adminAuth, getErranzerDetails)
router.get("/details/users", adminAuth, getUserDetails)
router.patch("/pending-erranzers/:id", adminAuth, approveorRejectErranzer)
router.patch("/user/:id", adminAuth, userManagemnent)


module.exports = router;
