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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Safely access AuthContext with a fallback
  const authContext = useContext(AuthContext);
  const forgotPassword = authContext?.forgotPassword || (async () => {
    return { success: false, message: "Authentication service unavailable" };
  });
  
  const error = authContext?.error;
  const clearError = authContext?.clearError || (() => {});

  const validate = () => {
    console.log('ForgotPassword - Validating form with email:', email);
    let validationErrors: Record<string, string> = {};
    
    // Validate email
    if (!email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = 'Email is invalid';
    }
    
    console.log('ForgotPassword - Validation errors:', Object.keys(validationErrors).length > 0 ? validationErrors : 'None');
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('ForgotPassword - Handle submit button pressed');
    try {
      if (validate()) {
        console.log('ForgotPassword - Validation passed, attempting to send reset email to:', email);
        setIsLoading(true);
        
        const result = await forgotPassword(email);
        console.log('ForgotPassword - Request result:', result);
        
        setIsLoading(false);
        if (result.success) {
          setSuccess(true);
          Alert.alert(
            "Reset Email Sent",
            "Check your email for instructions to reset your password.",
            [{ text: "OK" }]
          );
        }
      } else {
        console.log('ForgotPassword - Validation failed');
      }
    } catch (error) {
      console.error("ForgotPassword - Unexpected error:", error);
      setIsLoading(false);
      Alert.alert("Error", "An unexpected error occurred. Please try again later.");
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
            <Text style={styles.title}>Forgot Password</Text>
          </View>
          
          <View style={styles.form}>
            {!success ? (
              <>
                <Text style={styles.instructions}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
                
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
                
                <CustomButton
                  title="Send Reset Link"
                  onPress={handleSubmit}
                  loading={isLoading}
                  style={styles.button}
                />
                
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={60} color={COLORS.success} style={styles.successIcon} />
                <Text style={styles.successTitle}>Email Sent</Text>
                <Text style={styles.successText}>
                  We've sent a password reset link to {email}. Please check your email and follow the instructions.
                </Text>
                <CustomButton
                  title="Back to Login"
                  onPress={() => router.push('/login')}
                  style={styles.button}
                />
              </View>
            )}
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remember your password?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Login</Text>
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
  instructions: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
    marginBottom: SIZES.padding * 2,
  },
  button: {
    marginTop: SIZES.padding * 2,
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
  successContainer: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  successIcon: {
    marginBottom: SIZES.padding,
  },
  successTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  successText: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding * 3,
  },
  loginText: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
  },
  loginLink: {
    ...FONTS.textRegular,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SIZES.base,
  },
}); 