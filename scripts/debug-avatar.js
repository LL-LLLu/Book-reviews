// Debug script for avatar upload
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testAvatarUpload() {
  try {
    console.log('🔍 Avatar Upload Debug Test');
    console.log('==========================');
    
    // Test server static file serving
    console.log('\n1️⃣ Testing static file route...');
    try {
      const testUrl = 'http://localhost:5001/uploads/avatars/test.jpg';
      const response = await axios.get(testUrl, { 
        validateStatus: () => true 
      });
      console.log(`GET ${testUrl}: ${response.status}`);
      
      if (response.status === 404) {
        console.log('✅ Static route is configured (404 is expected for non-existent file)');
      }
    } catch (err) {
      console.log('❌ Static route might not be configured:', err.message);
    }
    
    // Check if uploads directory exists
    console.log('\n2️⃣ Checking uploads directory...');
    const uploadsDir = path.join(__dirname, 'backend/uploads/avatars');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`✅ Uploads directory exists with ${files.length} files`);
      if (files.length > 0) {
        console.log('Sample files:', files.slice(0, 3));
      }
    } else {
      console.log('❌ Uploads directory not found at:', uploadsDir);
    }
    
    // Test authentication
    console.log('\n3️⃣ Testing authentication...');
    console.log('Please login first and get your JWT token from browser DevTools:');
    console.log('1. Open DevTools (F12)');
    console.log('2. Go to Application/Storage → Local Storage');
    console.log('3. Find "token" and copy its value');
    console.log('4. Update the TOKEN variable in this script');
    
    // Test with a real token
    const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token
    
    if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
      console.log('\n⚠️  Please update TOKEN variable with your actual JWT token');
      return;
    }
    
    // Test avatar endpoint
    console.log('\n4️⃣ Testing avatar endpoint...');
    const form = new FormData();
    
    // Create a test image
    const testImagePath = path.join(__dirname, 'test-avatar.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.log('Creating test image...');
      // Create a simple 1x1 pixel JPEG
      const buffer = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
      fs.writeFileSync(testImagePath, buffer);
    }
    
    form.append('avatar', fs.createReadStream(testImagePath));
    
    try {
      const response = await axios.post('http://localhost:5001/api/auth/avatar', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      
      console.log('✅ Avatar upload successful!');
      console.log('Response:', response.data);
      
      // Test if the uploaded avatar is accessible
      if (response.data.user?.avatar) {
        const avatarUrl = `http://localhost:5001${response.data.user.avatar}`;
        console.log('\n5️⃣ Testing avatar accessibility...');
        console.log('Avatar URL:', avatarUrl);
        
        const avatarResponse = await axios.get(avatarUrl, {
          validateStatus: () => true
        });
        
        if (avatarResponse.status === 200) {
          console.log('✅ Avatar is accessible!');
        } else {
          console.log(`❌ Avatar not accessible: ${avatarResponse.status}`);
        }
      }
    } catch (err) {
      console.log('❌ Avatar upload failed:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        console.log('   Token might be expired or invalid');
      }
    }
    
    // Clean up
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAvatarUpload();