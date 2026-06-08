import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (projectId) {
    console.log(`Initializing Firebase Admin for project: ${projectId}`);
  } else {
    console.log('Initializing Firebase Admin using Application Default Credentials (ADC)');
  }
  admin.initializeApp({
    projectId
  });
}

export const db = admin.firestore();
export default db;
