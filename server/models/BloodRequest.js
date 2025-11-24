const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requesterName: {
    type: String,
    required: true,
  },
  bloodType: {
    type: String,
    required: true,
  },
  hospital: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 👈 This assumes your user model is named 'User'
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
