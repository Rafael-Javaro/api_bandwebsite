const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { register, makeAdmin, getUserProfile } = require('../controllers/authController');

// Register route (public)
router.post('/register', register);

// Get current user profile (authenticated)
router.get('/profile', authenticateUser, getUserProfile);

// Make a user an admin (admin only)
router.post('/make-admin', authenticateAdmin, makeAdmin);

module.exports = router;