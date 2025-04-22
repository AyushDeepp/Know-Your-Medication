import React, { createContext, useContext } from 'react';
import { useAuthStore } from '../store/authStore';
import { router } from 'expo-router';

// Create context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useAuthStore();
  
  // Check authentication status when the app starts
  React.useEffect(() => {
    console.log('AuthContext - Initializing and checking auth status');
    const checkInitialAuth = async () => {
      try {
        console.log('AuthContext - Running initial auth check');
        await auth.checkAuth();
        console.log('AuthContext - Auth check complete, token:', auth.token ? 'Exists' : 'None');
      } catch (error) {
        console.error("AuthContext - Error checking auth:", error);
      }
    };
    
    checkInitialAuth();
  }, []);
  
  // Handle navigation on auth state changes
  React.useEffect(() => {
    console.log('AuthContext - Auth state changed, token:', auth.token ? 'Exists' : 'None');
    
    if (!auth.isLoading) {
      if (auth.token) {
        console.log('AuthContext - User authenticated, redirecting to home');
        router.replace('/home');
      } else if (auth.token === null && auth.user === null) {
        // This condition helps differentiate between initial load and logout
        console.log('AuthContext - User logged out, redirecting to welcome');
        router.replace('/welcome');
      }
    }
  }, [auth.token, auth.isLoading, auth.user]);
  
  // Create a wrapped logout function that navigates
  const handleLogout = async () => {
    console.log('AuthContext - Handling logout');
    await auth.logout();
  };
  
  const contextValue = {
    user: auth.user,
    token: auth.token,
    isLoading: auth.isLoading,
    error: auth.error,
    isAuthenticated: !!auth.token,
    login: auth.login,
    register: auth.register,
    logout: handleLogout,
    forgotPassword: auth.forgotPassword,
    resetPassword: auth.resetPassword,
    clearError: auth.clearError,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export for Expo Router
export { AuthContext as default }; 