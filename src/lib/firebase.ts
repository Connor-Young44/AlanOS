import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { env } from "./env";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  appId: env.FIREBASE_APP_ID,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  measurementId: env.MEASUREMENT_ID,
};

// Validate required config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error('Missing Firebase configuration keys:', missingKeys);
  throw new Error(`Missing Firebase config: ${missingKeys.join(', ')}. Check your .env.local file.`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth, firestore, and storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export the app instance for advanced usage
export default app;
