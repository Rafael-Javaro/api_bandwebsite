const { auth, db } = require('../config/firebase');
const { logger } = require('../utils/logger');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: true, 
        message: 'Email, password, and name are required' 
      });
    }
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });
    
    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      createdAt: new Date().toISOString(),
      isAdmin: false
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Make a user an admin (only callable by an existing admin)
const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Get the user
    const userRecord = await auth.getUser(userId);
    
    // Set custom claim
    await auth.setCustomUserClaims(userId, { admin: true });
    
    // Update in Firestore
    await db.collection('users').doc(userId).update({
      isAdmin: true,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `User ${userRecord.email} is now an admin` 
    });
  } catch (error) {
    logger.error('Make admin error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Get current user's profile
const getUserProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'User not found' 
      });
    }
    
    const userData = userDoc.data();
    
    // Remove sensitive information
    delete userData.password;
    
    return res.status(200).json({ 
      success: true, 
      user: userData 
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

module.exports = {
  register,
  makeAdmin,
  getUserProfile
};