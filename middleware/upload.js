const multer = require('multer');
const { logger } = require('../utils/logger');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      error: true,
      message: err.message
    });
  } else if (err) {
    logger.error('Upload error:', err);
    return res.status(400).json({
      error: true,
      message: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError
};