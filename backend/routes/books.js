const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const Review = require('../models/Review');
const { auth, adminAuth } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/books');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created book uploads directory:', uploadDir);
  } catch (error) {
    console.error('Failed to create book uploads directory:', error);
  }
}

// Configure multer for book cover uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'book-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all books with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Add search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Filter by genre
    if (req.query.genre) {
      query.genres = req.query.genre;
    }
    
    // Filter by author
    if (req.query.author) {
      query.author = new RegExp(req.query.author, 'i');
    }
    
    // Sort options
    let sort = {};
    switch (req.query.sort) {
      case 'rating':
        sort = { averageRating: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
    
    const books = await Book.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('addedBy', 'username');
    
    const total = await Book.countDocuments(query);
    
    res.json({
      books,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBooks: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search Google Books API (must be before /:id route)
router.get('/search-google', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    console.log('Searching Google Books for:', query);

    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
      params: {
        q: query,
        maxResults: 10,
        printType: 'books'
      }
    });

    console.log('Google Books API response:', response.status);
    console.log('Items found:', response.data.items?.length || 0);

    const books = response.data.items?.map(item => {
      const volumeInfo = item.volumeInfo || {};
      return {
        googleId: item.id,
        title: volumeInfo.title || '',
        author: volumeInfo.authors?.join(', ') || 'Unknown Author',
        description: (volumeInfo.description || '').substring(0, 4000), // Truncate to 4000 chars max
        isbn: volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || 
              volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
        coverImage: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                    volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:') || '',
        publisher: volumeInfo.publisher || '',
        publicationDate: volumeInfo.publishedDate || '',
        pageCount: volumeInfo.pageCount || 0,
        language: volumeInfo.language || 'en',
        genres: volumeInfo.categories || []
      };
    }) || [];

    console.log('Processed books:', books.length);
    res.json({ books });
  } catch (error) {
    console.error('Google Books API error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error searching Google Books', error: error.message });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('addedBy', 'username');
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new book (authenticated users only)
router.post('/', auth, upload.single('coverImage'), [
  body('title').notEmpty().trim(),
  body('author').notEmpty().trim(),
  body('description').notEmpty().trim(),
  // Custom validator for genres to handle both array (JSON) and single strings
  body('genres').custom((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) && parsed.length > 0;
        } catch {
            return value.trim().length > 0;
        }
    }
    return false;
  }),
  body('isbn').optional().trim(),
  body('publisher').optional().trim(),
  body('publicationDate').optional(), // Removed isISO8601 strict check as FormData might send different format
  body('pageCount').optional(),
  body('language').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there's a file uploaded but validation failed, delete the file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }
    
    let coverImageUrl = req.body.coverImage; // URL provided in body (optional)

    if (req.file) {
      coverImageUrl = `/uploads/books/${req.file.filename}`;
    }
    
    // Handle genres parsing
    let genres = req.body.genres;
    if (typeof genres === 'string') {
        try {
            genres = JSON.parse(genres);
        } catch (e) {
            // If not JSON, assume it's a single genre or comma separated
            if (genres.includes(',')) {
                genres = genres.split(',').map(g => g.trim());
            } else {
                genres = [genres];
            }
        }
    }

    const bookData = {
      ...req.body,
      genres, // Use parsed genres
      coverImage: coverImageUrl,
      addedBy: req.user._id
    };
    
    const book = new Book(bookData);
    await book.save();
    
    await book.populate('addedBy', 'username');
    
    res.status(201).json({ book });
  } catch (error) {
    console.error(error);
    // If there's a file uploaded but save failed, delete the file
    if (req.file) {
        fs.unlinkSync(req.file.path);
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Book with this ISBN already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update book (admin only)
router.put('/:id', adminAuth, [
  body('title').optional().trim(),
  body('author').optional().trim(),
  body('description').optional().trim(),
  body('genres').optional().isArray(),
  body('isbn').optional().trim(),
  body('publisher').optional().trim(),
  body('publicationDate').optional().isISO8601(),
  body('pageCount').optional().isInt({ min: 1 }),
  body('language').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete book (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Delete all reviews for this book
    await Review.deleteMany({ book: req.params.id });
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ book: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('user', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username avatar'
        }
      });
    
    const total = await Review.countDocuments({ book: req.params.id });
    
    // Add upvotes field for frontend compatibility
    const reviewsWithUpvotes = reviews.map(review => {
      const reviewObj = review.toObject();
      reviewObj.upvotes = reviewObj.likes || [];
      return reviewObj;
    });
    
    res.json({
      reviews: reviewsWithUpvotes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;