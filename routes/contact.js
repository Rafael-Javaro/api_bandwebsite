const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const {
  submitContactForm,
  getAllContactSubmissions,
  updateContactStatus
} = require('../controllers/contactController');

// Public routes
router.post('/', submitContactForm);

// Admin routes
router.get('/', authenticateAdmin, getAllContactSubmissions);
router.put('/:contactId', authenticateAdmin, updateContactStatus);

module.exports = router;