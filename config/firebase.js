const admin = require('firebase-admin');
const { logger } = require('../utils/logger');
const path = require('path');

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    logger.info('Using Firebase service account from environment variable');
  } else {
    const serviceAccountPath = (__dirname, '../serviceAccountKey.json');
    serviceAccount = require(serviceAccountPath);
    logger.info('Using Firebase service account from projectId:', serviceAccount);
  }
} catch (error) {
  logger.error('Failed to load Firebase service account:', error);
  process.exit(1);
}

// Initialize Firebase with explicit project configuration
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  databaseURL: `https://bandwebsiteapi-default-rtdb.firebaseio.com/`,
  storageBucket: `${serviceAccount.project_id}.appspot.com`
};

try {
  admin.initializeApp(firebaseConfig);
  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Firebase initialization failed:', error);
  process.exit(1);
}

const db = admin.database();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage
};