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
import { COLORS, FONTS, SIZES } from '../utils/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Safely access AuthContext with a fallback
  const authContext = useContext(AuthContext);
  const resetPassword = authContext?.resetPassword || (async () => {
    return { success: false, message: "Authentication service unavailable" };
  });
  
  const error = authContext?.error;
  const clearError = authContext?.clearError || (() => {});

  const validate = () => {
    console.log('ResetPassword - Validating form');
    let validationErrors: Record<string, string> = {};
    
    // Validate password
    if (!password) {
      validationErrors.password = 'Password is required';
    } else if (password.length < 6) {
      validationErrors.password = 'Password should be at least 6 characters';
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }
    
    console.log('ResetPassword - Validation errors:', Object.keys(validationErrors).length > 0 ? validationErrors : 'None');
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('ResetPassword - Handle submit button pressed');
    try {
      if (validate()) {
        console.log('ResetPassword - Validation passed, attempting to reset password');
        setIsLoading(true);
        
        const result = await resetPassword(token as string, password);
        console.log('ResetPassword - Request result:', result);
        
        setIsLoading(false);
        if (result.success) {
          setSuccess(true);
          Alert.alert(
            "Password Reset",
            "Your password has been successfully reset.",
            [{ 
              text: "Login Now", 
              onPress: () => router.push('/login')
            }]
          );
        }
      } else {
        console.log('ResetPassword - Validation failed');
      }
    } catch (error) {
      console.error("ResetPassword - Unexpected error:", error);
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
              onPress={() => router.push('/login')}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
          </View>
          
          <View style={styles.form}>
            {!success ? (
              <>
                <Text style={styles.instructions}>
                  Enter your new password below.
                </Text>
                
                <CustomInput
                  label="New Password"
                  placeholder="Enter new password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.grey} />}
                />
                
                <CustomInput
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  error={errors.confirmPassword}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.grey} />}
                />
                
                <CustomButton
                  title="Reset Password"
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
                <Text style={styles.successTitle}>Password Reset</Text>
                <Text style={styles.successText}>
                  Your password has been successfully reset. You can now log in with your new password.
                </Text>
                <CustomButton
                  title="Login"
                  onPress={() => router.push('/login')}
                  style={styles.button}
                />
              </View>
            )}
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
}); 