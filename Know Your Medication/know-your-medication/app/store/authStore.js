import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        console.log('AuthStore - Setting loading state for login');
        set({ isLoading: true, error: null });
        try {
          console.log('AuthStore - Calling login service');
          const result = await authService.login(email, password);
          console.log('AuthStore - Login successful, updating state with user:', result.user.name);
          set({ 
            token: result.token, 
            user: result.user, 
            isLoading: false 
          });
          return true;
        } catch (error) {
          console.log('AuthStore - Login failed:', error.message);
          set({ 
            error: error.message, 
            isLoading: false 
          });
          return false;
        }
      },
      
      register: async (userData) => {
        console.log('AuthStore - Setting loading state for registration');
        set({ isLoading: true, error: null });
        try {
          console.log('AuthStore - Calling register service');
          const result = await authService.register(userData);
          console.log('AuthStore - Registration successful, updating state with user:', result.user.name);
          set({ 
            token: result.token, 
            user: result.user, 
            isLoading: false 
          });
          return true;
        } catch (error) {
          console.log('AuthStore - Registration failed:', error.message);
          set({ 
            error: error.message, 
            isLoading: false 
          });
          return false;
        }
      },
      
      logout: async () => {
        console.log('AuthStore - Setting loading state for logout');
        set({ isLoading: true });
        try {
          console.log('AuthStore - Calling logout service');
          await authService.logout();
          console.log('AuthStore - Logout successful, clearing state');
          set({ 
            token: null, 
            user: null, 
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.log('AuthStore - Logout failed:', error.message);
          set({ 
            error: error.message, 
            isLoading: false 
          });
        }
      },
      
      checkAuth: async () => {
        const { token } = get();
        console.log('AuthStore - Checking auth with token:', token ? 'Exists' : 'None');
        if (!token) return false;
        
        console.log('AuthStore - Setting loading state for auth check');
        set({ isLoading: true });
        try {
          console.log('AuthStore - Calling checkAuth service');
          const { isValid, user } = await authService.checkAuth(token);
          if (isValid) {
            console.log('AuthStore - Auth check successful, token is valid');
            set({ user, isLoading: false });
            return true;
          } else {
            console.log('AuthStore - Auth check failed, token is invalid');
            set({ 
              token: null, 
              user: null, 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          console.log('AuthStore - Auth check error:', error.message);
          set({ 
            error: error.message, 
            isLoading: false 
          });
          return false;
        }
      },
      
      forgotPassword: async (email) => {
        console.log('AuthStore - Setting loading state for forgot password');
        set({ isLoading: true, error: null });
        try {
          console.log('AuthStore - Calling forgotPassword service');
          const result = await authService.forgotPassword(email);
          console.log('AuthStore - Forgot password successful');
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.log('AuthStore - Forgot password failed:', error.message);
          set({ 
            error: error.message, 
            isLoading: false 
          });
          return { success: false, message: error.message };
        }
      },
      
      resetPassword: async (token, password) => {
        console.log('AuthStore - Setting loading state for reset password');
        set({ isLoading: true, error: null });
        try {
          console.log('AuthStore - Calling resetPassword service');
          const result = await authService.resetPassword(token, password);
          console.log('AuthStore - Reset password successful');
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.log('AuthStore - Reset password failed:', error.message);
          set({ 
            error: error.message, 
            isLoading: false 
          });
          return { success: false, message: error.message };
        }
      },
      
      clearError: () => {
        console.log('AuthStore - Clearing error state');
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Default export for Expo Router
export default function AuthStore() {
  return null; // This component is not meant to be rendered directly
} 