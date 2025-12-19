// Mock Firebase for Jest tests  
export const auth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((callback) => {
    // Call callback immediately with null user
    callback(null);
    return jest.fn(); // Return unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn(),
  signInAnonymously: jest.fn(),
  signOut: jest.fn(),
} as any;

export const db = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
} as any;

export const storage = {
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  listAll: jest.fn(),
} as any;

export default {
  auth,
  db,
  storage,
};
