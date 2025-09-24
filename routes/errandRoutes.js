const express = require('express')
const { postErrand, getAllErrands, getErrandById, deleteErrand, editErrand, assignErrand } = require('../controllers/ErrandController')
const { authToken, checkOwnership, checkErrandOwnership } = require('../middleware/auth')
const router = express.Router()

router.post("/", authToken, postErrand)
router.get("/", getAllErrands)
router.get("/:id", getErrandById)
router.delete("/:id", authToken, checkOwnership, deleteErrand)
router.put("/:id", authToken,checkErrandOwnership, editErrand)
router.put("/assign/:id", authToken, assignErrand)

module.exports = router;
