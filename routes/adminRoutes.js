const express = require('express')
const { adminGetAllErrands, getTotalUsers, getTotalErranzers, getErranzerDetails, getUserDetails, getUnverifiedErranzers, approveorRejectErranzer, userManagemnent, getAnalytics, getUsers, getErranzers } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');
const { getDisputes } = require('../controllers/disputeController');
const router = express.Router()

router.get("/errands", adminAuth, adminGetAllErrands)
router.get("/users/count", adminAuth, getTotalUsers)
router.get("/erranzer/count", adminAuth, getTotalErranzers) 
router.get("/pending-erranzers", adminAuth, getUnverifiedErranzers)
router.get("/details/erranzers", adminAuth, getErranzers)
router.get("/user/:id", adminAuth, getUserDetails)
router.get("/erranzer/:id", adminAuth, getErranzerDetails)
router.get("/users", adminAuth, getUsers)
router.get("/analytics", adminAuth, getAnalytics)
router.get("/disputes", adminAuth, getDisputes)
router.patch("/pending-erranzers/:id", adminAuth, approveorRejectErranzer)
router.patch("/user/:id", adminAuth, userManagemnent)


module.exports = router;
