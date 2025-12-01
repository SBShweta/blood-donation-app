const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getUserDonations, createDonation } = require('../controllers/donationsController');
const router = express.Router();


router.get('/my-donations', protect, getUserDonations);


router.post('/', protect, createDonation);

module.exports = router;
