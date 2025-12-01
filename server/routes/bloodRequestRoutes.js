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


router.post('/', protect, createBloodRequest);


router.get('/my-requests', protect, getMyBloodRequests);


router.use(protectAdmin);

router.get('/', getAllBloodRequests);
router.put('/approve/:id', approveRequest);
router.put('/reject/:id', rejectRequest);

module.exports = router;
