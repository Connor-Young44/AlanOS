import "@testing-library/jest-dom";

// Mock environment variables for tests
process.env.VITE_FIREBASE_API_KEY = "test-api-key";
process.env.VITE_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.VITE_FIREBASE_PROJECT_ID = "test-project";
process.env.VITE_FIREBASE_APP_ID = "test-app-id";
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.VITE_ADMIN_EMAIL = "admin@example.com";
