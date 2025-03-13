const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');

// Add a comment to a photo (authenticated users only)
const addComment = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { content } = req.body;
    const userId = req.user.uid;
    
    if (!content) {
      return res.status(400).json({ 
        error: true, 
        message: 'Comment content is required' 
      });
    }
    
    // Check if photo exists
    const photoDoc = await db.collection('photos').doc(photoId).get();
    
    if (!photoDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Photo not found' 
      });
    }
    
    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'User not found' 
      });
    }
    
    const userData = userDoc.data();
    
    // Create comment
    const commentRef = db.collection('comments').doc();
    await commentRef.set({
      photoId,
      userId,
      userName: userData.name,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: null
    });
    
    // Update comment count on the photo
    await db.collection('photos').doc(photoId).update({
      commentsCount: photoDoc.data().commentsCount + 1,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'Comment added successfully',
      commentId: commentRef.id
    });
  } catch (error) {
    logger.error('Add comment error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Get comments for a photo
const getCommentsForPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Check if photo exists
    const photoDoc = await db.collection('photos').doc(photoId).get();
    
    if (!photoDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Photo not found' 
      });
    }
    
    // Get comments for the photo
    const commentsSnapshot = await db.collection('comments')
      .where('photoId', '==', photoId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const comments = [];
    commentsSnapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ 
      success: true, 
      comments,
      totalCount: photoDoc.data().commentsCount
    });
  } catch (error) {
    logger.error('Get comments for photo error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Update a comment (comment owner only)
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.uid;
    
    if (!content) {
      return res.status(400).json({ 
        error: true, 
        message: 'Comment content is required' 
      });
    }
    
    // Get the comment
    const commentDoc = await db.collection('comments').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Comment not found' 
      });
    }
    
    // Check if user is the comment owner
    if (commentDoc.data().userId !== userId) {
      return res.status(403).json({ 
        error: true, 
        message: 'You can only update your own comments' 
      });
    }
    
    // Update the comment
    await db.collection('comments').doc(commentId).update({
      content,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Comment updated successfully' 
    });
  } catch (error) {
    logger.error('Update comment error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Delete a comment (comment owner or admin)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.admin === true;
    
    // Get the comment
    const commentDoc = await db.collection('comments').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Comment not found' 
      });
    }
    
    const commentData = commentDoc.data();
    
    // Check if user is the comment owner or an admin
    if (commentData.userId !== userId && !isAdmin) {
      return res.status(403).json({ 
        error: true, 
        message: 'You can only delete your own comments' 
      });
    }
    
    // Get the photo
    const photoDoc = await db.collection('photos').doc(commentData.photoId).get();
    
    // Delete the comment
    await db.collection('comments').doc(commentId).delete();
    
    // Update comment count on the photo if it exists
    if (photoDoc.exists) {
      await db.collection('photos').doc(commentData.photoId).update({
        commentsCount: Math.max(0, photoDoc.data().commentsCount - 1),
        updatedAt: new Date().toISOString()
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Comment deleted successfully' 
    });
  } catch (error) {
    logger.error('Delete comment error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Like a photo (authenticated users only)
const likePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.uid;
    
    // Check if photo exists
    const photoDoc = await db.collection('photos').doc(photoId).get();
    
    if (!photoDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Photo not found' 
      });
    }
    
    // Check if user already liked this photo
    const likeDoc = await db.collection('likes')
      .where('photoId', '==', photoId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (!likeDoc.empty) {
      return res.status(400).json({ 
        error: true, 
        message: 'You already liked this photo' 
      });
    }
    
    // Create like document
    const likeRef = db.collection('likes').doc();
    await likeRef.set({
      photoId,
      userId,
      createdAt: new Date().toISOString()
    });
    
    // Update like count on the photo
    await db.collection('photos').doc(photoId).update({
      likesCount: photoDoc.data().likesCount + 1,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'Photo liked successfully' 
    });
  } catch (error) {
    logger.error('Like photo error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Unlike a photo (authenticated users only)
const unlikePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.uid;
    
    // Check if photo exists
    const photoDoc = await db.collection('photos').doc(photoId).get();
    
    if (!photoDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Photo not found' 
      });
    }
    
    // Find user's like for this photo
    const likesSnapshot = await db.collection('likes')
      .where('photoId', '==', photoId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (likesSnapshot.empty) {
      return res.status(400).json({ 
        error: true, 
        message: 'You have not liked this photo' 
      });
    }
    
    // Delete the like document
    await likesSnapshot.docs[0].ref.delete();
    
    // Update like count on the photo
    await db.collection('photos').doc(photoId).update({
      likesCount: Math.max(0, photoDoc.data().likesCount - 1),
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Photo unliked successfully' 
    });
  } catch (error) {
    logger.error('Unlike photo error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Check if user has liked a photo
const checkLikeStatus = async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.uid;
    
    // Check if photo exists
    const photoDoc = await db.collection('photos').doc(photoId).get();
    
    if (!photoDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Photo not found' 
      });
    }
    
    // Check if user liked this photo
    const likeDoc = await db.collection('likes')
      .where('photoId', '==', photoId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    const hasLiked = !likeDoc.empty;
    
    return res.status(200).json({ 
      success: true, 
      hasLiked
    });
  } catch (error) {
    logger.error('Check like status error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

module.exports = {
  addComment,
  getCommentsForPhoto,
  updateComment,
  deleteComment,
  likePhoto,
  unlikePhoto,
  checkLikeStatus
};