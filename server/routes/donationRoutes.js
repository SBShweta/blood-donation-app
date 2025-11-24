const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getUserDonations, createDonation } = require('../controllers/donationsController');
const router = express.Router();

// Route to get all donations made by the authenticated user
router.get('/my-donations', protect, getUserDonations);

// Route to handle donation form submission
router.post('/', protect, createDonation);

module.exports = router;
