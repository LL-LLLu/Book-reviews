// MongoDB initialization script
db = db.getSiblingDB('bookreview');

// Create collections
db.createCollection('users');
db.createCollection('books');
db.createCollection('reviews');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "googleId": 1 }, { sparse: true, unique: true });

db.books.createIndex({ "title": 1 });
db.books.createIndex({ "author": 1 });
db.books.createIndex({ "isbn": 1 }, { sparse: true });
db.books.createIndex({ "genres": 1 });
db.books.createIndex({ "averageRating": -1 });

db.reviews.createIndex({ "book": 1 });
db.reviews.createIndex({ "user": 1 });
db.reviews.createIndex({ "rating": 1 });
db.reviews.createIndex({ "createdAt": -1 });

print('Database initialized successfully!');