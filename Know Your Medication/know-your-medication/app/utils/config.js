import Constants from 'expo-constants';

// API Configuration
// Get the API URL from app.config.js or fallback to the Render deployment
export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://know-your-medication-api.onrender.com';

// For reference:
// Development options:
// 'http://localhost:5000' - Local development (works with web)
// 'http://10.0.2.2:5000' - Android emulator
// 'http://192.168.70.68:5000' - Local network IP (useful for physical devices)

// Other app configuration settings can be added here
export const APP_VERSION = '1.0.0';
export const DEFAULT_TIMEOUT = 10000; // 10 seconds timeout for API calls

// Theme constants can also be added here if needed

// Default export for Expo Router
export default function Config() {
  return null; // This component is not meant to be rendered directly
} 