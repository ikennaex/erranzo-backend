const express = require('express')
const { getUserProfile, updateUserProfile, getAllErrandsPosted, getAllAcceptedErrands, updateAccountType } = require('../controllers/userController')
const {authToken, checkOwnership} = require('../middleware/auth')
const router = express.Router()

router.get('/errands/allpostederrands', authToken, getAllErrandsPosted)  // get all errands posted by a user 
router.get('/errands/allacceptederrands', authToken, getAllAcceptedErrands)  // get all errands posted by a user 
router.get('/:id', getUserProfile)
router.put('/:id', authToken, checkOwnership, updateUserProfile)
router.put('/account-type/:id', authToken, checkOwnership, updateAccountType)


module.exports = router 