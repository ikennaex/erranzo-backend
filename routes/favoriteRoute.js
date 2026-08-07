const express = require('express')
const { authToken } = require('../middleware/auth')
const { getFavourites, checkFavourite, toggleFavourite } = require('../controllers/favoriteController')
const router = express.Router()

router.post("/:erranzerId", authToken, toggleFavourite)
router.get("/check/:erranzerId", authToken, checkFavourite)
router.get("/", authToken, getFavourites) 


module.exports = router;
