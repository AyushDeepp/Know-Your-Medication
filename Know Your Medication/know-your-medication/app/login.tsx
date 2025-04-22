import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import CustomInput from './components/CustomInput';
import CustomButton from './components/CustomButton';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Safely access AuthContext with a fallback
  const authContext = useContext(AuthContext);
  console.log('Login - Auth Context:', authContext ? 'Available' : 'Not available');

  // We need a fallback if the context isn't available yet
  const login = authContext?.login || (async () => {
    console.log('Login - Using fallback login function');
    setLocalError("Authentication service unavailable");
    return false;
  });
  
  const error = authContext?.error || localError;
  const clearError = authContext?.clearError || (() => setLocalError(null));

  const validate = () => {
    console.log('Login - Validating form with email:', email);
    let validationErrors: Record<string, string> = {};
    
    // Validate email
    if (!email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!password) {
      validationErrors.password = 'Password is required';
    } else if (password.length < 6) {
      validationErrors.password = 'Password should be at least 6 characters';
    }
    
    console.log('Login - Validation errors:', Object.keys(validationErrors).length > 0 ? validationErrors : 'None');
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('Login - Handle login button pressed');
    try {
      if (validate()) {
        console.log('Login - Validation passed, attempting login with:', email);
        setIsLoading(true);
        
        const success = await login(email, password);
        console.log('Login - Login attempt result:', success ? 'Success' : 'Failed');
        
        setIsLoading(false);
        if (success) {
          console.log('Login - Login successful, user should be redirected');
          // Navigation will be handled by the auth context navigation container
        } else {
          console.log('Login - Login failed with error:', error);
        }
      } else {
        console.log('Login - Validation failed, not attempting login');
      }
    } catch (error) {
      console.error("Login - Unexpected error during login:", error);
      setIsLoading(false);
      setLocalError("Login failed. Please try again later.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Login</Text>
          </View>
          
          <View style={styles.form}>
            <CustomInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.grey} />}
            />
            
            <CustomInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.grey} />}
            />
            
            <CustomButton
              title="Login"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.button}
            />
            
            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: SIZES.padding * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  backButton: {
    marginRight: SIZES.padding,
  },
  title: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  form: {
    marginTop: SIZES.padding,
  },
  button: {
    marginTop: SIZES.padding,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SIZES.padding,
  },
  forgotPasswordText: {
    ...FONTS.textRegular,
    color: COLORS.primary,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    padding: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    marginTop: SIZES.padding,
  },
  errorText: {
    ...FONTS.textRegular,
    color: COLORS.error,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding * 3,
  },
  registerText: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
  },
  registerLink: {
    ...FONTS.textRegular,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SIZES.base,
  },
}); 