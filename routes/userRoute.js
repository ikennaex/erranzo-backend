const express = require('express')
const { getUserProfile, updateUserProfile, getAllErrandsPosted, getAllAcceptedErrands } = require('../controllers/userController')
const {authToken, checkOwnership} = require('../middleware/auth')
const router = express.Router()

router.get('/:id', getUserProfile)
router.get('/allpostederrands', authToken, getAllErrandsPosted)  // get all errands posted by a user 
router.get('/allacceptederrands', authToken, getAllAcceptedErrands)  // get all errands posted by a user 
router.put('/:id', authToken, checkOwnership, updateUserProfile)



module.exports = router 