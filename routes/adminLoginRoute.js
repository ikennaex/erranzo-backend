const express = require('express');
const { adminLogin, adminRegister } = require('../controllers/adminLogin');
const router = express.Router()

// router.post('/register', adminRegister);
router.post('/login', adminLogin);
router.post('/register', adminRegister);
// router.post('/refresh', adminRefreshTokenHandler);
// router.post('/logout', adminAuth, adminLogout);

// router.get('/profile', adminAuth, getAdminProfile);

module.exports = router 