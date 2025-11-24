const express = require('express');
const router = express.Router();
const {
  createBloodRequest,
  getAllBloodRequests,
  getMyBloodRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/bloodRequestController');

const { protect, protectAdmin } = require('../middleware/authMiddleware');

// ✅ Route to create a request (user must be logged in)
router.post('/', protect, createBloodRequest);

// ✅ Route to get current user's blood requests
router.get('/my-requests', protect, getMyBloodRequests);

// 🔐 Admin-only routes
router.use(protectAdmin);

router.get('/', getAllBloodRequests);
router.put('/approve/:id', approveRequest);
router.put('/reject/:id', rejectRequest);

module.exports = router;
