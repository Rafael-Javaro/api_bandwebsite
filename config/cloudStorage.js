const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { logger } = require('../utils/logger');

// Initialize Google Cloud Storage
let storage;
try {
  if (process.env.GCP_KEY_FILE) {
    storage = new Storage({
      keyFilename: process.env.GCP_KEY_FILE
    });
  } else if (process.env.GCP_CREDENTIALS) {
    storage = new Storage({
      credentials: JSON.parse(process.env.GCP_CREDENTIALS)
    });
  } else {
    // When running on Cloud Run, it will use the default service account
    storage = new Storage();
  }
} catch (error) {
  logger.error('Failed to initialize Google Cloud Storage:', error);
  process.exit(1);
}

const bucketName = process.env.STORAGE_BUCKET || 'your-band-photos';
const bucket = storage.bucket(bucketName);

module.exports = {
  storage,
  bucket,
  bucketName
};