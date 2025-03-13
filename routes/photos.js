const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadPhoto,
  getPhotosForConcert,
  deletePhoto
} = require('../controllers/photoController');

// Public routes
router.get('/concert/:concertId', getPhotosForConcert);

// Admin routes
router.post('/concert/:concertId', 
  authenticateAdmin, 
  upload.single('photo'), 
  handleUploadError,
  uploadPhoto
);
router.delete('/:photoId', authenticateAdmin, deletePhoto);

module.exports = router;