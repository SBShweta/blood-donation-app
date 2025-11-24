const BloodRequest = require('../models/BloodRequest');

// @desc    Create a new blood request
// @route   POST /api/blood-requests
// @access  Private (Recipient)
const createBloodRequest = async (req, res) => {
  try {
    const { requesterName, bloodType, hospital, contactNumber } = req.body;

    if (!requesterName || !bloodType || !hospital || !contactNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newRequest = new BloodRequest({
      requesterName,
      bloodType,
      hospital,
      contactNumber,
      status: 'pending',
      user: req.user.id,
    });

    await newRequest.save();
    res.status(201).json({ message: 'Blood request submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all blood requests (admin only)
// @route   GET /api/blood-requests
const getAllBloodRequests = async (req, res) => {
  try {
    const bloodRequests = await BloodRequest.find();
    res.json(bloodRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get recipient's own blood requests
// @route   GET /api/blood-requests/my-requests
const getMyBloodRequests = async (req, res) => {
    try {
      console.log('🔍 Fetching blood requests for user:', req.user.id);
      const requests = await BloodRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
      console.log('📋 Found blood requests:', requests.length);
      
      // ✅ RETURN EMPTY ARRAY INSTEAD OF 404
      res.json(requests);
    } catch (err) {
      console.error('❌ Error fetching blood requests:', err);
      res.status(500).json({ message: err.message });
    }
  };
  
// @desc    Approve blood request
// @route   PUT /api/blood-requests/approve/:id
const approveRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);
    if (!bloodRequest) return res.status(404).json({ message: 'Not found' });

    bloodRequest.status = 'approved';
    await bloodRequest.save();

    res.json({ message: 'Request approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reject blood request
// @route   PUT /api/blood-requests/reject/:id
const rejectRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);
    if (!bloodRequest) return res.status(404).json({ message: 'Not found' });

    bloodRequest.status = 'rejected';
    await bloodRequest.save();

    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBloodRequest,
  getAllBloodRequests,
  getMyBloodRequests,
  approveRequest,
  rejectRequest,
};