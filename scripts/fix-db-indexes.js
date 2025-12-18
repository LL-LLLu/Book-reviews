const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookreview';

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const collection = mongoose.connection.collection('books');
    
    console.log('Listing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    const textIndex = indexes.find(i => i.key._fts === 'text');
    
    if (textIndex) {
      console.log(`Found text index: ${textIndex.name}. Dropping it...`);
      await collection.dropIndex(textIndex.name);
      console.log('Index dropped successfully.');
    } else {
      console.log('No text index found.');
    }
    
    console.log('The application will recreate the index with new settings on next startup.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

fixIndexes();
