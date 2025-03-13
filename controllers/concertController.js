const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');

// Create a new concert (admin only)
const createConcert = async (req, res) => {
  try {
    const { title, date, venue, description } = req.body;
    
    if (!title || !date || !venue) {
      return res.status(400).json({ 
        error: true, 
        message: 'Title, date, and venue are required' 
      });
    }
    
    // Create a new concert document
    const concertRef = db.collection('concerts').doc();
    
    await concertRef.set({
      title,
      date: new Date(date).toISOString(),
      venue,
      description: description || '',
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid,
      photosCount: 0
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'Concert created successfully',
      concertId: concertRef.id
    });
  } catch (error) {
    logger.error('Create concert error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Get all concerts
const getAllConcerts = async (req, res) => {
  try {
    const concertsSnapshot = await db.collection('concerts')
      .orderBy('date', 'desc')
      .get();
    
    const concerts = [];
    concertsSnapshot.forEach(doc => {
      concerts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ 
      success: true, 
      concerts 
    });
  } catch (error) {
    logger.error('Get all concerts error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Get a single concert by ID
const getConcertById = async (req, res) => {
  try {
    const { concertId } = req.params;
    
    const concertDoc = await db.collection('concerts').doc(concertId).get();
    
    if (!concertDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Concert not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      concert: {
        id: concertDoc.id,
        ...concertDoc.data()
      }
    });
  } catch (error) {
    logger.error('Get concert by ID error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Update a concert (admin only)
const updateConcert = async (req, res) => {
  try {
    const { concertId } = req.params;
    const { title, date, venue, description } = req.body;
    
    const concertRef = db.collection('concerts').doc(concertId);
    const concertDoc = await concertRef.get();
    
    if (!concertDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Concert not found' 
      });
    }
    
    const updates = {};
    if (title) updates.title = title;
    if (date) updates.date = new Date(date).toISOString();
    if (venue) updates.venue = venue;
    if (description !== undefined) updates.description = description;
    updates.updatedAt = new Date().toISOString();
    
    await concertRef.update(updates);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Concert updated successfully' 
    });
  } catch (error) {
    logger.error('Update concert error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Delete a concert (admin only)
const deleteConcert = async (req, res) => {
  try {
    const { concertId } = req.params;
    
    const concertRef = db.collection('concerts').doc(concertId);
    const concertDoc = await concertRef.get();
    
    if (!concertDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Concert not found' 
      });
    }
    
    // First, get all photos associated with this concert
    const photosSnapshot = await db.collection('photos')
      .where('concertId', '==', concertId)
      .get();
    
    // Delete all photos in a batch
    const batch = db.batch();
    photosSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the concert
    batch.delete(concertRef);
    
    await batch.commit();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Concert and associated photos deleted successfully' 
    });
  } catch (error) {
    logger.error('Delete concert error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

module.exports = {
  createConcert,
  getAllConcerts,
  getConcertById,
  updateConcert,
  deleteConcert
};