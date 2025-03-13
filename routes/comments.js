const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
  addComment,
  getCommentsForPhoto,
  updateComment,
  deleteComment,
  likePhoto,
  unlikePhoto,
  checkLikeStatus
} = require('../controllers/commentController');

// Public routes
router.get('/photo/:photoId', getCommentsForPhoto);

// Authenticated routes
router.post('/photo/:photoId', authenticateUser, addComment);
router.put('/:commentId', authenticateUser, updateComment);
router.delete('/:commentId', authenticateUser, deleteComment);

// Like routes
router.post('/like/photo/:photoId', authenticateUser, likePhoto);
router.delete('/like/photo/:photoId', authenticateUser, unlikePhoto);
router.get('/like/photo/:photoId', authenticateUser, checkLikeStatus);

module.exports = router;