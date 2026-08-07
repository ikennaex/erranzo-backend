const express = require('express')
const { getRebookData } = require('../controllers/rebookErrandController')
const { authToken } = require('../middleware/auth')
const router = express.Router()

router.get('/:id/rebook-data', authToken, getRebookData) 

module.exports = router 