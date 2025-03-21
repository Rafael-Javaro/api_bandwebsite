const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { db } = require('./config/firebase');

// Import routes
const authRoutes = require('./routes/auth');
const concertRoutes = require('./routes/concerts');
const photoRoutes = require('./routes/photos');
const commentRoutes = require('./routes/comments');
const contactRoutes = require('./routes/contact');

// Import middleware
const { logger } = require('./utils/logger');

// Initialize express
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // HTTP request logging
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/concerts', concertRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Test Firebase connection
app.get('/api/test-firebase', async (req, res) => {
  try {
    await db.ref('test')
      .set({
        test: 'test',
        timestamp: new Date()
      })
      .then(() => {
        logger.info('Firebase writte test successful');
      });
    res.status(200).json({ message: 'Firebase connection successful' });
  } catch (error) {
    logger.error('Firebase test error:', error);
    res.status(500).json({ error: 'Firebase connection failed', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;