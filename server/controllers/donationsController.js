const Donation = require('../models/Donation');

// Get all donations of the logged-in user
exports.getUserDonations = async (req, res) => {
    try {
      const userId = req.user._id; // Get the user ID from the JWT token
      console.log('🔍 Fetching donations for user:', userId);

      // Query the donations associated with the user
      const donations = await Donation.find({ user: userId }).sort({ createdAt: -1 });
      console.log('📋 Found donations:', donations.length);

      // ❌ CHANGE THIS: Don't return 404 for empty results
      // ✅ RETURN EMPTY ARRAY INSTEAD
      res.status(200).json(donations); // This will return [] if no donations
      
    } catch (err) {
      console.error('❌ Error fetching donations:', err);
      res.status(500).json({ message: 'Server error while fetching donations.' });
    }
  };

// Create a new donation
exports.createDonation = async (req, res) => {
  const { donorName, bloodType, location, contactNumber } = req.body;

  if (!donorName || !bloodType || !location || !contactNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    console.log('🎯 Creating donation for user:', req.user._id);
    
    const newDonation = new Donation({ 
      donorName, 
      bloodType, 
      location, 
      contactNumber,
      user: req.user._id  
    });

    await newDonation.save();
    console.log('✅ Donation saved successfully:', newDonation._id);
    
    res.status(201).json({ message: 'Thank you for your donation!' });
  } catch (err) {
    console.error('❌ Error saving donation:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};