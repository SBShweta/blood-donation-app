// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  age: Number,
  gender: String,
  bloodType: String,
  location: String,
  role: {
    type: String,
    enum: ['donor', 'recipient', 'admin'],
    default: 'donor',
  },
});

module.exports = mongoose.model('User', userSchema);
