const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Book = require('../models/Book');
const Comment = require('../models/Comment');
const { auth, adminAuth } = require('../middleware/auth');

// Get single review by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('book', 'title author coverImage')
      .populate('user', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username avatar'
        }
      });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Add upvotes field (mapping from likes for backward compatibility)
    const reviewObj = review.toObject();
    reviewObj.upvotes = reviewObj.likes || [];
    
    res.json(reviewObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reviews (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('book', 'title author')
      .populate('user', 'username email');
    
    const total = await Review.countDocuments();
    
    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create review
router.post('/', auth, [
  body('book').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').notEmpty().trim(),
  body('content').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { book, rating, title, content } = req.body;
    
    // Check if book exists
    const bookExists = await Book.findById(book);
    if (!bookExists) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if user already reviewed this book
    const existingReview = await Review.findOne({
      book,
      user: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }
    
    const review = new Review({
      book,
      user: req.user._id,
      rating,
      title,
      content
    });
    
    await review.save();
    await review.populate('user', 'username avatar');
    
    res.status(201).json({ review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update review
router.put('/:id', auth, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().trim(),
  body('content').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }
    
    const updates = {};
    ['rating', 'title', 'content'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    Object.assign(review, updates);
    await review.save();
    await review.populate('user', 'username avatar');
    
    res.json({ review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }
    
    const bookId = review.book;
    await review.deleteOne();
    
    // Update book rating
    const Book = require('../models/Book');
    const stats = await Review.aggregate([
      { $match: { book: bookId } },
      {
        $group: {
          _id: '$book',
          averageRating: { $avg: '$rating' },
          ratingsCount: { $sum: 1 }
        }
      }
    ]);
    
    if (stats.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        ratingsCount: stats[0].ratingsCount
      });
    } else {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: 0,
        ratingsCount: 0
      });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/unlike review
router.post('/:id/like', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const likeIndex = review.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      // Unlike
      review.likes.splice(likeIndex, 1);
    } else {
      // Like
      review.likes.push(req.user._id);
    }
    
    await review.save();
    await review.populate('user', 'username avatar');
    
    res.json({ review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upvote/downvote review (alias for like functionality)
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const upvoteIndex = review.likes.indexOf(req.user._id);
    
    if (upvoteIndex > -1) {
      // Remove upvote
      review.likes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      review.likes.push(req.user._id);
    }
    
    await review.save();
    await review.populate([
      { path: 'user', select: 'username avatar' },
      { path: 'book', select: 'title author coverImage' },
      {
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username avatar'
        }
      }
    ]);
    
    // Return review with upvotes field for frontend compatibility
    const reviewObj = review.toObject();
    reviewObj.upvotes = reviewObj.likes || [];
    
    res.json(reviewObj);
  } catch (error) {
    console.error('🔴 Upvote endpoint error:', error);
    console.error('🔴 Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reviews
router.get('/user/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('book', 'title author coverImage')
      .populate('user', 'username avatar');
    
    const total = await Review.countDocuments({ user: req.params.userId });
    
    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete any review (admin only)
router.delete('/:id/admin', adminAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const bookId = review.book;
    await review.deleteOne();
    
    // Update book rating
    const stats = await Review.aggregate([
      { $match: { book: bookId } },
      {
        $group: {
          _id: '$book',
          averageRating: { $avg: '$rating' },
          ratingsCount: { $sum: 1 }
        }
      }
    ]);
    
    if (stats.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        ratingsCount: stats[0].ratingsCount
      });
    } else {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: 0,
        ratingsCount: 0
      });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to review
router.post('/:id/comments', auth, [
  body('content').notEmpty().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const comment = new Comment({
      review: req.params.id,
      user: req.user._id,
      content: req.body.content
    });

    await comment.save();
    await comment.populate('user', 'username avatar');

    // Add comment to review
    review.comments.push(comment._id);
    await review.save();

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a review
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ review: req.params.id })
      .sort({ createdAt: 1 })
      .populate('user', 'username avatar');

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment (comment author only)
router.delete('/:reviewId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      review: req.params.reviewId,
      user: req.user._id
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    await comment.deleteOne();

    // Remove comment from review
    await Review.findByIdAndUpdate(req.params.reviewId, {
      $pull: { comments: req.params.commentId }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;