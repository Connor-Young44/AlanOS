import "@testing-library/jest-dom";

// Mock import.meta.env for Vite projects in Jest
// @ts-ignore
global.import = {
  meta: {
    env: {
      VITE_FIREBASE_API_KEY: "test-api-key",
      VITE_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "test-project",
      VITE_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
      VITE_FIREBASE_APP_ID: "test-app-id",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "123456",
      VITE_MEASUREMENT_ID: "G-TEST",
      VITE_ADMIN_EMAIL: "admin@test.com",
      VITE_CLOUDINARY_NAME: "test-cloudinary",
    },
  },
};

// Mock firebase/auth functions
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn();
  }),
  signInAnonymously: jest.fn(),
  browserLocalPersistence: {},
  setPersistence: jest.fn(() => Promise.resolve()),
}));

// Mock firebase/firestore functions
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: "test-id" })),
  collection: jest.fn(),
  query: jest.fn((col) => col),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
  onSnapshot: jest.fn(),
}));

// Mock firebase/storage functions
jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  listAll: jest.fn(),
}));
