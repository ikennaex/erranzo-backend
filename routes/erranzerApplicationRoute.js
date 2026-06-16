const express = require('express')
const { authToken } = require('../middleware/auth')
const { applyErranzer } = require('../controllers/erranzerApplicationController')
const router = express.Router()

router.post("/apply", authToken, applyErranzer)
// router.get("/", getAllErrands)


module.exports = router;
