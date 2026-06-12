const express = require('express')
const router = express.Router()
const { authToken } = require('../middleware/auth');
const { getReviews, postReview } = require('../controllers/reviewController');


router.get('/user/:id', authToken, getReviews);
router.post('/', authToken, postReview);


module.exports = router;
