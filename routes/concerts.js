const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const {
  createConcert,
  getAllConcerts,
  getConcertById,
  updateConcert,
  deleteConcert
} = require('../controllers/concertController');

// Public routes
router.get('/', getAllConcerts);
router.get('/:concertId', getConcertById);

// Admin routes
router.post('/', authenticateAdmin, createConcert);
router.put('/:concertId', authenticateAdmin, updateConcert);
router.delete('/:concertId', authenticateAdmin, deleteConcert);

module.exports = router;