const express = require('express')
const { postErrand, getAllErrands, getErrandById, deleteErrand, editErrand } = require('../controllers/ErrandController')
const router = express.Router()

router.post("/", postErrand)
router.get("/", getAllErrands)
router.get("/:id", getErrandById)
router.delete("/:id", deleteErrand)
router.put("/:id", editErrand)

module.exports = router;
