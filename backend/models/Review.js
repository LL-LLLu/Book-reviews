const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one review per user per book
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

// Update timestamp on save
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update book rating after review save
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const Book = mongoose.model('Book');
  
  const stats = await Review.aggregate([
    { $match: { book: this.book } },
    {
      $group: {
        _id: '$book',
        averageRating: { $avg: '$rating' },
        ratingsCount: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Book.findByIdAndUpdate(this.book, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      ratingsCount: stats[0].ratingsCount
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);