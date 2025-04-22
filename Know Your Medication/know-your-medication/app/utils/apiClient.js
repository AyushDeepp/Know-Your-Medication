import axios from 'axios';
import { API_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get auth state from storage
      const authData = await AsyncStorage.getItem('auth-storage');
      if (authData) {
        const { state } = JSON.parse(authData);
        if (state?.token) {
          config.headers['Authorization'] = `Bearer ${state.token}`;
        }
      }
    } catch (error) {
      console.error('API Client - Error attaching token to request:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('API Client - Unauthorized, clearing auth token');
      // Could implement token refresh logic here
      // For now, just clear the token to force login
      try {
        await AsyncStorage.removeItem('auth-storage');
      } catch (storageError) {
        console.error('API Client - Error clearing auth storage:', storageError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 