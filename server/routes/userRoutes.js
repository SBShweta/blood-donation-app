const express = require('express');
const User = require('../models/User');
const router = express.Router();

const { protectAdmin } = require('../middleware/authMiddleware');

// Middleware for Admin Authentication (to be added later)

router.use(protectAdmin);
// Route to get all users (Admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to delete a user (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




module.exports = router;
