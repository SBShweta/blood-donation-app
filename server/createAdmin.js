const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Replace with your DB URL
const MONGO_URI = 'mongodb://localhost:27017/blooddonation';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => createAdminUser())
  .catch((err) => console.error(err));

const createAdminUser = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@blood.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('✅ Admin user created!');
  } else {
    console.log('⚠️ Admin already exists.');
  }
  mongoose.disconnect();
};
