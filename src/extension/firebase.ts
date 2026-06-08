import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  connectAuthEmulator,
  type Auth
} from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8yDMvLyzR4nBJlk8AI7kyNoEErecrw9g";

let auth: Auth | null = null;

if (apiKey && apiKey !== '') {
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "prismspace-extension.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "prismspace-extension",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "prismspace-extension.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "163554481658",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:163554481658:web:9cba55f2272d8ea1738043",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0NRLQ43CC6"
  };

  try {
    const app = initializeApp(firebaseConfig);
    // Initialize Auth with IndexedDB persistence for robustness in extension service workers
    auth = initializeAuth(app, {
      persistence: indexedDBLocalPersistence
    });

    // Connect to Auth Emulator if URL is provided in development
    if (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL) {
      connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL);
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Auth:', err);
  }
} else {
  console.warn('Firebase VITE_FIREBASE_API_KEY is not set. Firebase Authentication features will be disabled.');
}

export { auth };

/**
 * Gets the current authenticated user's ID token.
 * Returns null if user is not authenticated or Firebase Auth is not configured.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (err) {
    console.error('Failed to get Firebase ID token:', err);
    return null;
  }
}
