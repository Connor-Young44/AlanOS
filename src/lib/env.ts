// Environment variable helper for Vite projects
// This file wraps import.meta.env to make it mockable in Jest tests

export function getEnv(key: string, defaultValue: string = ""): string {
  // In tests, import.meta may not exist, so return default
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return defaultValue;
  }
  return (import.meta.env[key] as string) || defaultValue;
}

export const env = {
  FIREBASE_API_KEY: getEnv("VITE_FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: getEnv("VITE_FIREBASE_PROJECT_ID"),
  FIREBASE_STORAGE_BUCKET: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  FIREBASE_APP_ID: getEnv("VITE_FIREBASE_APP_ID"),
  FIREBASE_MESSAGING_SENDER_ID: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  MEASUREMENT_ID: getEnv("VITE_MEASUREMENT_ID"),
  ADMIN_EMAIL: getEnv("VITE_ADMIN_EMAIL", "admin@example.com"),
  CLOUDINARY_NAME: getEnv("VITE_CLOUDINARY_NAME"),
};
