import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if critical configuration variables are present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_firebase_api_key_here'
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    if (isFirebaseConfigured) {
      app = initializeApp(firebaseConfig);
    } else {
      // Fallback app configuration to allow development and graceful UI warnings
      app = initializeApp({
        apiKey: 'demo-api-key',
        authDomain: 'demo-project.firebaseapp.com',
        projectId: 'demo-project',
        storageBucket: 'demo-project.appspot.com',
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:0000000000000000000000'
      });
    }
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { app, auth, db };
