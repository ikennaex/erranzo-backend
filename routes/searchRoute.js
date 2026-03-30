const express = require('express')
const { handleSearch } = require('../controllers/searchController')
const router = express.Router()

router.get('/', handleSearch) 

module.exports = router 