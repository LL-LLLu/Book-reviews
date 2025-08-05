// Test MongoDB connection
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:Aa2291718824@mongodb:27017/bookreview?authSource=admin';

console.log('🔍 Testing MongoDB Connection');
console.log('============================');
console.log('URI:', MONGODB_URI);
console.log('');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connection successful');
    
    // Test creating a collection
    const testSchema = new mongoose.Schema({
      test: String,
      created: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('Test', testSchema);
    
    return Test.create({ test: 'connection test' });
  })
  .then(() => {
    console.log('✅ Database write test successful');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:');
    console.log('Error:', err.message);
    console.log('Code:', err.code);
    process.exit(1);
  });