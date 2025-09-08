const express = require('express')
const { postErrand, getAllErrands, getErrandById, deleteErrand, editErrand, assignErrand } = require('../controllers/ErrandController')
const { authToken, checkOwnership } = require('../middleware/auth')
const router = express.Router()

router.post("/", authToken, postErrand)
router.get("/", getAllErrands)
router.get("/:id", getErrandById)
router.delete("/:id", checkOwnership, deleteErrand)
router.put("/:id", checkOwnership, editErrand)
router.put("/assign/:id", authToken, assignErrand)

module.exports = router;
