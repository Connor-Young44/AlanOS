// Mock environment variables for Jest tests
export function getEnv(key: string, defaultValue: string = ""): string {
  return defaultValue;
}

export const env = {
  FIREBASE_API_KEY: "test-api-key",
  FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  FIREBASE_PROJECT_ID: "test-project",
  FIREBASE_STORAGE_BUCKET: "test.appspot.com",
  FIREBASE_APP_ID: "test-app-id",
  FIREBASE_MESSAGING_SENDER_ID: "123456",
  MEASUREMENT_ID: "G-TEST",
  ADMIN_EMAIL: "admin@test.com",
  CLOUDINARY_NAME: "test-cloudinary",
};
