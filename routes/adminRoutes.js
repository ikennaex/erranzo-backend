const express = require('express')
const {
  adminGetAllErrands,
  getTotalUsers,
  getTotalErranzers,
  getErranzerDetails,
  getUserDetails,
  getUnverifiedErranzers,
  approveorRejectErranzer,
  userManagemnent,
  getAnalytics,
  getUsers,
  getErranzers,
  adminDeleteErrand,
  adminGetErrandChatHistory,
  deleteUser,
} = require("../controllers/adminController");
const { adminAuth } = require("../middleware/auth");
const {
  getDisputes,
  getDisputeDetails,
  resolveDispute,
} = require("../controllers/disputeController");
const router = express.Router();

router.get("/errands", adminAuth, adminGetAllErrands);
router.get("/users/count", adminAuth, getTotalUsers);
router.get("/erranzer/count", adminAuth, getTotalErranzers);
router.get("/pending-erranzers", adminAuth, getUnverifiedErranzers);
router.get("/details/erranzers", adminAuth, getErranzers);
router.get("/user/:id", adminAuth, getUserDetails);
router.delete("/user/:id", adminAuth, deleteUser);
router.delete("/users/:id", adminAuth, deleteUser);
router.get("/erranzer/:id", adminAuth, getErranzerDetails);
router.get("/erranzers/:id", adminAuth, getErranzerDetails);
router.get("/users", adminAuth, getUsers);
router.get("/analytics", adminAuth, getAnalytics);
router.patch("/pending-erranzers/:id", adminAuth, approveorRejectErranzer);
router.patch("/user/:id", adminAuth, userManagemnent);

// errand admin deletion & chat history
router.delete("/errands/:id", adminAuth, adminDeleteErrand);
router.delete("/errand/:id", adminAuth, adminDeleteErrand);
router.get("/errands/:id/chat", adminAuth, adminGetErrandChatHistory);
router.get("/errand/:id/chat", adminAuth, adminGetErrandChatHistory);

// disputes
router.get("/disputes", adminAuth, getDisputes);
router.get("/disputes/:id", adminAuth, getDisputeDetails);
router.get("/dispute/:id", adminAuth, getDisputeDetails);
router.patch("/disputes/:id/resolve", adminAuth, resolveDispute);

module.exports = router;
