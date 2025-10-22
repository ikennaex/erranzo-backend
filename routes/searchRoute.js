const express = require('express')
const { handleSearch } = require('../controllers/searchController')
const router = express.Router()

router.get('/search', handleSearch) 

module.exports = router 