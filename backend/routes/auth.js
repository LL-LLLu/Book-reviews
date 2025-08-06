const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
  } catch (error) {
    console.error('Failed to create uploads directory:', error);
  }
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer destination called for file:', file.originalname);
    console.log('Upload directory:', uploadDir);
    console.log('Directory exists:', fs.existsSync(uploadDir));
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    console.log('Multer filename called for user:', req.user._id);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = req.user._id + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
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
  },
  onError: (error, next) => {
    console.error('Multer error:', error);
    next(error);
  }
});

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// Update profile
router.put('/profile', auth, [
  body('username').optional().isLength({ min: 3 }).trim(),
  body('bio').optional().isLength({ max: 500 }).trim(),
  body('favoriteGenres').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const allowedUpdates = ['username', 'bio', 'favoriteGenres', 'avatar'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if username is already taken
    if (updates.username) {
      const existingUser = await User.findOne({ 
        username: updates.username, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update email
router.put('/email', auth, [
  body('email').isEmail().normalizeEmail(),
  body('password').optional() // Optional for Google users
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user with password field to compare
    const userWithPassword = await User.findById(req.user._id);
    if (!userWithPassword) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only require password verification for users who have a password set
    if (userWithPassword.password && userWithPassword.passwordSetup) {
      if (!password) {
        return res.status(400).json({ message: 'Password is required to change email' });
      }
      // Verify current password
      const isMatch = await userWithPassword.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user._id } 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email },
      { new: true, runValidators: true }
    );

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/password', auth, [
  body('currentPassword').optional(), // Optional for Google users who have set up password
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password field to compare
    const userWithPassword = await User.findById(req.user._id);
    if (!userWithPassword) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For Google users who have set up password, allow them to change it
    if (userWithPassword.googleId && userWithPassword.passwordSetup) {
      // If currentPassword is provided, verify it
      if (currentPassword) {
        const isMatch = await userWithPassword.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }
    } else if (!userWithPassword.googleId) {
      // Regular users must provide current password
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await userWithPassword.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    } else {
      // Google users who haven't set up password can't use this endpoint
      return res.status(400).json({ message: 'Please set up a password first' });
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload avatar
router.post('/avatar', auth, (req, res, next) => {
  console.log('Avatar upload route hit');
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('User authenticated:', !!req.user);
  
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Multer middleware error:', err);
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('Avatar upload request received');
    console.log('User:', req.user.email);
    console.log('File:', req.file);
    console.log('Request body:', req.body);
    
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Delete old avatar if exists
    if (req.user.avatar && !req.user.avatar.startsWith('http')) {
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(req.user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log('Deleted old avatar:', oldAvatarPath);
      }
    }

    // Update user avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('New avatar URL:', avatarUrl);
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );

    res.json({ user, avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors,
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete avatar
router.delete('/avatar', auth, async (req, res) => {
  try {
    if (req.user.avatar) {
      const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(req.user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: null },
      { new: true }
    );

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set password for Google users
router.post('/set-password', auth, [
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow Google users who haven't set up password
    if (!user.googleId || user.passwordSetup) {
      return res.status(400).json({ message: 'Password setup not allowed' });
    }

    user.password = req.body.password;
    user.passwordSetup = true;
    await user.save();

    res.json({ message: 'Password set successfully', user });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth login/register
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, username, avatar } = req.body;

    // Check if user already exists by Google ID
    let user = await User.findOne({ googleId });
    
    if (user) {
      // User exists, update their info if needed
      user.username = username || user.username;
      user.email = email || user.email;
      if (avatar && avatar !== user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
    } else {
      // Check if user exists by email (might have regular account)
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = googleId;
        if (avatar && !existingUser.avatar) {
          existingUser.avatar = avatar;
        }
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user
        let uniqueUsername = username;
        let counter = 1;
        
        // Ensure username is unique
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${username}${counter}`;
          counter++;
        }

        user = new User({
          username: uniqueUsername,
          email,
          googleId,
          avatar: avatar || null
        });
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ 
      token, 
      user,
      requirePasswordSetup: user.googleId && !user.passwordSetup
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

module.exports = router;