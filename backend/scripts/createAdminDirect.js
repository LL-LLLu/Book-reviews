const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Get email from command line argument
    const email = process.argv[2];
    const username = process.argv[3];
    const password = process.argv[4];
    
    if (!email || !username || !password) {
      console.log('Usage: node createAdminDirect.js <email> <username> <password>');
      console.log('Example: node createAdminDirect.js admin@example.com admin mypassword123');
      process.exit(1);
    }
    
    // Connect directly to MongoDB without authentication
    // This assumes you're running this inside the Docker container
    await mongoose.connect('mongodb://mongodb:27017/bookreview', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      directConnection: true
    });
    
    console.log('Connected to MongoDB (direct connection)');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Update existing user to admin
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`Updated existing user ${existingUser.username} to admin`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new User({
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        passwordSetup: true
      });
      
      await newAdmin.save();
      console.log(`Created new admin user: ${username} (${email})`);
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();