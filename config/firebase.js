const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

// Initialize Firebase Admin SDK with service account from environment
// For local development, you can use a JSON file, but for Cloud Run use environment variables
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('../serviceAccountKey.json');
  }
} catch (error) {
  logger.error('Failed to load Firebase service account:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET || 'your-band-website.appspot.com'
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage
};