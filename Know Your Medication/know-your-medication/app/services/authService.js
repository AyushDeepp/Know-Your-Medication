import axios from 'axios';
import { API_URL } from '../utils/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set up axios interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  console.log('AuthService - Login attempt with:', email);
  try {
    const response = await api.post('/api/users/login', { email, password });
    
    // Store the token in AsyncStorage
    await AsyncStorage.setItem('auth-token', response.data.token);
    
    console.log('AuthService - Login successful');
    return {
      token: response.data.token,
      user: {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        isApproved: response.data.isApproved
      }
    };
  } catch (error) {
    console.log('AuthService - Login failed:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

export const register = async (userData) => {
  console.log('AuthService - Register attempt with:', userData.email);
  try {
    const response = await api.post('/api/users/register', userData);
    
    // Store the token in AsyncStorage
    await AsyncStorage.setItem('auth-token', response.data.token);
    
    console.log('AuthService - Registration successful');
    return {
      token: response.data.token,
      user: {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        isApproved: response.data.isApproved
      }
    };
  } catch (error) {
    console.log('AuthService - Registration failed:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
  }
};

export const logout = async () => {
  console.log('AuthService - Logout attempt');
  
  // Remove the token from AsyncStorage
  await AsyncStorage.removeItem('auth-token');
  
  console.log('AuthService - Logout successful');
  return true;
};

export const checkAuth = async (token) => {
  console.log('AuthService - Checking auth with token:', token ? 'Token exists' : 'No token');
  
  if (!token) {
    console.log('AuthService - No token provided');
    return { isValid: false };
  }
  
  try {
    // Set the token in the request header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Verify the token by making a request to a protected endpoint
    const response = await api.get('/api/users/profile');
    
    console.log('AuthService - Token is valid');
    return {
      isValid: true,
      user: response.data
    };
  } catch (error) {
    console.log('AuthService - Token is invalid or expired');
    // Remove the invalid token
    await AsyncStorage.removeItem('auth-token');
    
    return { isValid: false };
  }
};

export const forgotPassword = async (email) => {
  console.log('AuthService - Forgot password request for:', email);
  try {
    const response = await api.post('/api/users/forgot-password', { email });
    console.log('AuthService - Forgot password request successful');
    return { success: true, message: response.data.message };
  } catch (error) {
    console.log('AuthService - Forgot password request failed:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to process password reset request. Please try again.');
  }
};

export const resetPassword = async (token, password) => {
  console.log('AuthService - Reset password request with token');
  try {
    const response = await api.post('/api/users/reset-password', { token, password });
    console.log('AuthService - Reset password request successful');
    return { success: true, message: response.data.message };
  } catch (error) {
    console.log('AuthService - Reset password request failed:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to reset password. Please try again.');
  }
};

// Default export for Expo Router
export default function AuthService() {
  return null; // This component is not meant to be rendered directly
} 