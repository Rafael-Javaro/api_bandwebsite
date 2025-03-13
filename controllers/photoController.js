const { db } = require('../config/firebase');
const { bucket } = require('../config/cloudStorage');
const { logger } = require('../utils/logger');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Upload a photo (admin only)
const uploadPhoto = async (req, res) => {
  try {
    const { concertId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ 
        error: true, 
        message: 'No file provided' 
      });
    }
    
    // Check if concert exists
    const concertDoc = await db.collection('concerts').doc(concertId).get();
    
    if (!concertDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Concert not found' 
      });
    }
    
    // Generate a unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const thumbFileName = `thumb_${fileName}`;
    
    // Define file paths in Google Cloud Storage
    const filePath = `concerts/${concertId}/${fileName}`;
    const thumbPath = `concerts/${concertId}/${thumbFileName}`;
    
    // Create file reference in GCS
    const fileUpload = bucket.file(filePath);
    const thumbUpload = bucket.file(thumbPath);
    
    // Generate thumbnail using sharp
    const thumbnailBuffer = await sharp(req.file.buffer)
      .resize({ width: 300, height: 300, fit: 'inside' })
      .toBuffer();
    
    // Upload original file to GCS
    const fileStream = fileUpload.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      }
    });
    
    // Handle errors during upload
    let uploadError = null;
    fileStream.on('error', (err) => {
      uploadError = err;
    });
    
    // Handle successful upload
    fileStream.on('finish', async () => {
      try {
        if (uploadError) {
          throw uploadError;
        }
        
        // Upload thumbnail
        const thumbStream = thumbUpload.createWriteStream({
          metadata: {
            contentType: req.file.mimetype
          }
        });
        
        thumbStream.on('error', (err) => {
          logger.error('Thumbnail upload error:', err);
        });
        
        thumbStream.on('finish', async () => {
          try {
            // Make both files public
            await fileUpload.makePublic();
            await thumbUpload.makePublic();
            
            // Get public URLs
            const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
            const thumbUrl = `https://storage.googleapis.com/${bucket.name}/${thumbPath}`;
            
            // Create photo document in Firestore
            const photoRef = db.collection('photos').doc();
            await photoRef.set({
              concertId,
              fileName,
              filePath,
              thumbPath,
              url: fileUrl,
              thumbnailUrl: thumbUrl,
              uploadedAt: new Date().toISOString(),
              uploadedBy: req.user.uid,
              likesCount: 0,
              commentsCount: 0
            });
            
            // Update photo count in concert document
            await db.collection('concerts').doc(concertId).update({
              photosCount: concertDoc.data().photosCount + 1,
              updatedAt: new Date().toISOString()
            });
            
            return res.status(201).json({
              success: true,
              message: 'Photo uploaded successfully',
              photoId: photoRef.id,
              url: fileUrl,
              thumbnailUrl: thumbUrl
            });
          } catch (error) {
            logger.error('Firestore update error:', error);
            return res.status(500).json({
              error: true,
              message: 'Failed to update database after upload'
            });
          }
        });
        
        thumbStream.end(thumbnailBuffer);
      } catch (error) {
        logger.error('File upload processing error:', error);
        return res.status(500).json({
          error: true,
          message: 'Failed to process file upload'
        });
      }
    });
    
    fileStream.end(req.file.buffer);
  } catch (error) {
    logger.error('Photo upload error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Get photos for a concert
const getPhotosForConcert = async (req, res) => {
  try {
    const { concertId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Check if concert exists
    const concertDoc = await db.collection('concerts').doc(concertId).get();
    
    if (!concertDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Concert not found' 
      });
    }
    
    // Get photos for the concert
    const photosSnapshot = await db.collection('photos')
      .where('concertId', '==', concertId)
      .orderBy('uploadedAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const photos = [];
    photosSnapshot.forEach(doc => {
      photos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ 
      success: true, 
      photos,
      totalCount: concertDoc.data().photosCount
    });
  } catch (error) {
    logger.error('Get photos for concert error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Delete a photo (admin only)
const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    
    // Get the photo document
    const photoDoc = await db.collection('photos').doc(photoId).get();
    
    if (!photoDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Photo not found' 
      });
    }
    
    const photoData = photoDoc.data();
    const { concertId, filePath, thumbPath } = photoData;
    
    // Delete the files from GCS
    try {
      await bucket.file(filePath).delete();
      await bucket.file(thumbPath).delete();
    } catch (error) {
      logger.error('File deletion error:', error);
      // Continue even if file deletion fails
    }
    
    // Delete all comments for this photo
    const commentsSnapshot = await db.collection('comments')
      .where('photoId', '==', photoId)
      .get();
    
    // Delete photo and comments in a batch
    const batch = db.batch();
    commentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete photo document
    batch.delete(photoDoc.ref);
    
    // Update photo count in concert document
    const concertRef = db.collection('concerts').doc(concertId);
    const concertDoc = await concertRef.get();
    
    if (concertDoc.exists) {
      batch.update(concertRef, {
        photosCount: Math.max(0, concertDoc.data().photosCount - 1),
        updatedAt: new Date().toISOString()
      });
    }
    
    await batch.commit();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Photo deleted successfully' 
    });
  } catch (error) {
    logger.error('Delete photo error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

module.exports = {
  uploadPhoto,
  getPhotosForConcert,
  deletePhoto
};