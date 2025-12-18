const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://35.173.211.34:3000', // Direct IP access
      'http://35-173-211-34.nip.io:3000', // nip.io domain access
      'http://lusbookreview.space:3000',
      'https://lusbookreview.space',
      process.env.FRONTEND_URL // Add your production frontend URL here
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Only parse JSON and URL-encoded data for non-multipart requests
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    // Skip JSON/URL parsing for multipart requests
    return next();
  }
  return express.json()(req, res, next);
});

app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    // Skip URL encoding parsing for multipart requests
    return next();
  }
  return express.urlencoded({ extended: true })(req, res, next);
});

// Serve static files (avatars)
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Book Review API is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Basic health check response
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'operational',
        database: mongoStatus
      }
    };
    
    // If MongoDB is disconnected, set status to degraded
    if (mongoStatus !== 'connected') {
      health.status = 'degraded';
    }
    
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookreview', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});