
// const donationSchema = new mongoose.Schema({
//   donorName: {
//     type: String,
//     required: true,
//   },
//   bloodType: {
//     type: String,
//     required: true,
//   },
//   location: {
//     type: String,
//     required: true,
//   },
//   contactNumber: {
//     type: String,
//     required: true,
//   },
//   // donatedAt: {
//   //   type: Date,
//   //   default: Date.now,
//   // },
//   user: {  // Adding a reference to the User model
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,  // Ensures that each donation is linked to a user
//   },
//   { timestamps: true }});
const mongoose = require('mongoose');

  const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  bloodType: { type: String, required: true },
  location: { type: String, required: true },
  contactNumber: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });  // ✅ this adds createdAt, updatedAt automatically


module.exports = mongoose.model('Donation', donationSchema);


