const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function listAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookreview', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    console.log('\\nCurrent Admin Users:');
    console.log('====================');
    
    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select('username email createdAt');
    
    if (admins.length === 0) {
      console.log('No admin users found.');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\\n${index + 1}. Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
      });
    }
    
    console.log('\\n====================');
    console.log(`Total admins: ${admins.length}`);
    
    // Disconnect
    await mongoose.disconnect();
    console.log('\\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listAdmins();