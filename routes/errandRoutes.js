const express = require('express')
const { postErrand, getAllErrands, getErrandById, deleteErrand, editErrand } = require('../controllers/ErrandController')
const { authToken, checkOwnership } = require('../middleware/auth')
const router = express.Router()

router.post("/", authToken, postErrand)
router.get("/", getAllErrands)
router.get("/:id", getErrandById)
router.delete("/:id", checkOwnership, deleteErrand)
router.put("/:id", checkOwnership, editErrand)

module.exports = router;
