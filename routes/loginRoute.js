const express = require('express')
const router = express.Router()
const { login, getLoggedUserProfile, refreshTokenHandler, logout, logoutAll } = require('../controllers/loginController');
const { authToken } = require('../middleware/auth');

router.post('/signin', login);
router.get('/profile', authToken, getLoggedUserProfile);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logout);
router.post('/logoutAll', logoutAll);

module.exports = router;
