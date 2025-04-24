import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // Get auth data from AsyncStorage
    const authData = await AsyncStorage.getItem('auth-storage');
    if (authData) {
      const { state } = JSON.parse(authData);
      return state?.token;
    }
    return null;
  } catch (error) {
    console.error('Error getting token', error);
    return null;
  }
};

export default api; 