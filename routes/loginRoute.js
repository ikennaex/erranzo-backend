const express = require('express')
const router = express.Router()
const { login } = require('../controllers/loginController');

router.post('/signin', login);

module.exports = router;
