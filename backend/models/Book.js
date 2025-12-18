const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000  // Increased to handle longer Google Books descriptions
  },
  coverImage: {
    type: String,
    default: null
  },
  genres: [{
    type: String,
    required: true
  }],
  publicationDate: {
    type: Date
  },
  publisher: {
    type: String,
    maxlength: 100
  },
  pageCount: {
    type: Number,
    min: 1
  },
  language: {
    type: String,
    default: 'English'
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update timestamp on save
bookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search functionality
// We set language_override to a non-existent field to prevent MongoDB from using the 'language' field
// for text search tokenization, which causes errors for unsupported languages (like 'zh-CN').
bookSchema.index({ title: 'text', author: 'text', description: 'text' }, { language_override: 'textSearchLanguage' });

module.exports = mongoose.model('Book', bookSchema);