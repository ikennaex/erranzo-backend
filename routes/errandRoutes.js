const express = require('express')
const { postErrand, getAllErrands, getErrandById, deleteErrand, editErrand, assignErrand, getQuickErrands, markCompleted } = require('../controllers/ErrandController')
const { authToken, checkOwnership, checkErrandOwnership } = require('../middleware/auth')
const router = express.Router()

router.post("/", authToken, postErrand)
router.get("/", getAllErrands)
router.get("/quick-errands", getQuickErrands)
router.get("/:id", getErrandById)
router.delete("/:id", authToken, checkErrandOwnership, deleteErrand)
router.put("/:id", authToken,checkErrandOwnership, editErrand)
router.put("/assign/:id", authToken, assignErrand)
router.put("/mark-completed/:id", authToken, markCompleted)

module.exports = router;
