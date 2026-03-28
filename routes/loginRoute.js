const express = require('express')
const router = express.Router()
const { login, getLoggedUserProfile, refreshTokenHandler, logout, mobileLogin } = require('../controllers/loginController');
const { authToken } = require('../middleware/auth');

router.post('/signin', login);
router.post('/mobile-signin', mobileLogin);
router.get('/profile', authToken, getLoggedUserProfile);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);

module.exports = router;
