import { Redirect } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS, FONTS } from './utils/theme';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

export default function Index() {
  console.log('Index - App starting, checking authentication state');
  
  // Use try-catch to handle potential undefined context
  try {
    const auth = useContext(AuthContext);
    console.log('Index - Auth context:', auth ? 'Available' : 'Not available');
    
    if (!auth) {
      console.log('Index - Auth context not available, redirecting to welcome');
      // If context is not available, redirect to welcome screen
      return <Redirect href="/welcome" />;
    }

    const { isLoading, token, isAuthenticated } = auth;
    console.log('Index - Auth state:', { 
      isLoading, 
      hasToken: !!token, 
      isAuthenticated 
    });

    if (isLoading) {
      console.log('Index - Auth is loading, showing loading screen');
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.background,
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    // Redirect to the appropriate screen
    if (isAuthenticated) {
      console.log('Index - User is authenticated, redirecting to home');
      return <Redirect href="/home" />;
    } else {
      console.log('Index - User is not authenticated, redirecting to welcome');
      return <Redirect href="/welcome" />;
    }
  } catch (error) {
    // Fallback for any context-related errors
    console.error("Index - Error accessing auth context:", error);
    return <Redirect href="/welcome" />;
  }
}
