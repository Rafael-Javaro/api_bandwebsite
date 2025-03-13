const { auth } = require('../config/firebase');
const { logger } = require('../utils/logger');

// Middleware to verify Firebase token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: true, 
        message: 'Unauthorized: No token provided' 
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ 
        error: true, 
        message: 'Unauthorized: Invalid token' 
      });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ 
      error: true, 
      message: 'Unauthorized: Authentication failed' 
    });
  }
};

// Middleware to verify admin status
const authenticateAdmin = async (req, res, next) => {
  try {
    // First, authenticate the user
    await authenticateUser(req, res, async () => {
      // Then check if user has admin custom claim
      const { uid } = req.user;
      const userRecord = await auth.getUser(uid);
      
      if (userRecord.customClaims && userRecord.customClaims.admin) {
        return next();
      }
      
      return res.status(403).json({ 
        error: true, 
        message: 'Forbidden: Admin access required' 
      });
    });
  } catch (error) {
    logger.error('Admin authentication error:', error);
    return res.status(403).json({ 
      error: true, 
      message: 'Forbidden: Authentication failed' 
    });
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin
};