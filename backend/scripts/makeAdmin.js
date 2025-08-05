const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function makeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookreview', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find the admin user and update role
    const user = await User.findOneAndUpdate(
      { email: 'admin@example.com' },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`User ${user.username} (${user.email}) has been granted admin privileges`);
    } else {
      console.log('User not found');
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();