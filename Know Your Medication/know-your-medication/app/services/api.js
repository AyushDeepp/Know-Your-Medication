import axios from 'axios';
import Constants from 'expo-constants';

// API base URL configuration
// This allows different envs to use different APIs
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://know-your-medication-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use(
  async (config) => {
    // Get token from secure storage
    const token = await getTokenFromStorage();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to get token from secure storage
const getTokenFromStorage = async () => {
  try {
    // Implementation depends on your storage method
    // Example using expo-secure-store:
    // const token = await SecureStore.getItemAsync('authToken');
    // return token;
    return null;
  } catch (error) {
    console.error('Error getting token', error);
    return null;
  }
};

export default api; 