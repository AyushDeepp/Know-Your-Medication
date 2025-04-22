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
import { COLORS, FONTS, SIZES, SHADOWS } from './utils/theme';
import CustomInput from './components/CustomInput';
import CustomButton from './components/CustomButton';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Admin registration code
const ADMIN_CODE = "ADMIN123"; // In a real app, this would be stored securely or verified on the server

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient', // Default role
    specialization: '',
    licenseNumber: '',
    adminCode: '',
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Safely access AuthContext with a fallback
  const authContext = useContext(AuthContext);
  console.log('Register - Auth Context:', authContext ? 'Available' : 'Not available');

  // We need a fallback if the context isn't available yet
  const register = authContext?.register || (async () => {
    console.log('Register - Using fallback register function');
    setLocalError("Registration service unavailable");
    return false;
  });
  
  const error = authContext?.error || localError;

  const updateFormField = (field, value) => {
    console.log(`Register - Updating field "${field}" with value:`, value);
    setFormData({ ...formData, [field]: value });
    
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateStep1 = () => {
    console.log('Register - Validating step 1 form data');
    let validationErrors: Record<string, string> = {};
    
    // Validate name
    if (!formData.name.trim()) {
      validationErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      validationErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      validationErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      validationErrors.password = 'Password should be at least 6 characters';
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }
    
    console.log('Register - Validation errors:', Object.keys(validationErrors).length > 0 ? validationErrors : 'None');
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };
  
  const validateStep2 = () => {
    let validationErrors: Record<string, string> = {};
    
    // Validate doctor specific fields
    if (formData.role === 'doctor') {
      if (!formData.specialization.trim()) {
        validationErrors.specialization = 'Specialization is required';
      }
      
      if (!formData.licenseNumber.trim()) {
        validationErrors.licenseNumber = 'License number is required';
      }
    }
    
    // Validate admin code
    if (formData.role === 'admin') {
      if (!formData.adminCode.trim()) {
        validationErrors.adminCode = 'Admin code is required';
      } else if (formData.adminCode !== ADMIN_CODE) {
        validationErrors.adminCode = 'Invalid admin code';
      }
    }
    
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleNextStep = () => {
    console.log('Register - Next button clicked');
    if (validateStep1()) {
      console.log('Register - Moving to step 2');
      setCurrentStep(2);
    } else {
      console.log('Register - Validation failed, staying on step 1');
    }
  };

  const handlePrevStep = () => {
    console.log('Register - Going back to step 1');
    setCurrentStep(1);
  };

  const handleRegistration = async () => {
    console.log('Register - Register button clicked with form data:', formData);
    
    // Validate step 2 data first
    if (!validateStep2()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare user data based on role
      let userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      
      // Add doctor-specific fields
      if (formData.role === 'doctor') {
        userData = {
          ...userData,
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
        };
      }
      
      // For admin, we don't send the code to the backend
      // The validation has already been done client-side
      
      console.log('Register - Attempting to register with data:', userData);
      const success = await register(userData);
      console.log('Register - Registration result:', success ? 'Success' : 'Failed');
      
      setIsLoading(false);
      if (success) {
        console.log('Register - Registration successful, user should be redirected');
        
        // Show confirmation for doctors that their account needs approval
        if (formData.role === 'doctor') {
          console.log('Register - Doctor registration, approval needed');
          Alert.alert(
            'Registration Successful',
            'Your account has been created, but requires approval from an administrator. You will be notified once your account is approved.',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('Register - Registration failed with error:', error);
      }
    } catch (error) {
      console.error('Register - Unexpected error during registration:', error);
      setIsLoading(false);
      setLocalError("Registration failed. Please try again later.");
    }
  };

  const renderStepOne = () => (
    <View style={styles.form}>
      <CustomInput
        label="Full Name"
        placeholder="Enter your full name"
        value={formData.name}
        onChangeText={(text) => updateFormField('name', text)}
        error={errors.name}
        leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.grey} />}
      />
      
      <CustomInput
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChangeText={(text) => updateFormField('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.grey} />}
      />
      
      <CustomInput
        label="Password"
        placeholder="Enter your password"
        value={formData.password}
        onChangeText={(text) => updateFormField('password', text)}
        secureTextEntry
        error={errors.password}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.grey} />}
      />
      
      <CustomInput
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChangeText={(text) => updateFormField('confirmPassword', text)}
        secureTextEntry
        error={errors.confirmPassword}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.grey} />}
      />
      
      <CustomButton
        title="Next"
        onPress={handleNextStep}
        style={styles.button}
      />
    </View>
  );

  const renderStepTwo = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Select User Type</Text>
      
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleCard,
            formData.role === 'patient' && styles.selectedRoleCard,
          ]}
          onPress={() => updateFormField('role', 'patient')}
        >
          <Ionicons
            name="person-outline"
            size={40}
            color={formData.role === 'patient' ? COLORS.white : COLORS.primary}
          />
          <Text
            style={[
              styles.roleTitle,
              formData.role === 'patient' && styles.selectedRoleTitle,
            ]}
          >
            Patient
          </Text>
          <Text
            style={[
              styles.roleDescription,
              formData.role === 'patient' && styles.selectedRoleTitle,
            ]}
          >
            Access prescriptions, lab reports, and medication details
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.roleCard,
            formData.role === 'doctor' && styles.selectedRoleCard,
          ]}
          onPress={() => updateFormField('role', 'doctor')}
        >
          <Ionicons
            name="medkit-outline"
            size={40}
            color={formData.role === 'doctor' ? COLORS.white : COLORS.green}
          />
          <Text
            style={[
              styles.roleTitle,
              { color: COLORS.green },
              formData.role === 'doctor' && styles.selectedRoleTitle,
            ]}
          >
            Doctor
          </Text>
          <Text
            style={[
              styles.roleDescription,
              formData.role === 'doctor' && styles.selectedRoleTitle,
            ]}
          >
            Manage patients, create prescriptions, and send reports
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Admin role option */}
      <TouchableOpacity
        style={[
          styles.adminRoleCard,
          formData.role === 'admin' && styles.selectedRoleCard,
        ]}
        onPress={() => updateFormField('role', 'admin')}
      >
        <Ionicons
          name="settings-outline"
          size={40}
          color={formData.role === 'admin' ? COLORS.white : COLORS.accent}
        />
        <Text
          style={[
            styles.roleTitle,
            { color: COLORS.accent },
            formData.role === 'admin' && styles.selectedRoleTitle,
          ]}
        >
          Administrator
        </Text>
        <Text
          style={[
            styles.roleDescription,
            formData.role === 'admin' && styles.selectedRoleTitle,
          ]}
        >
          Manage users, approve doctor requests, and oversee the system
        </Text>
      </TouchableOpacity>
      
      {/* Show doctor-specific fields when doctor role is selected */}
      {formData.role === 'doctor' && (
        <View style={styles.additionalFields}>
          <Text style={styles.additionalFieldsTitle}>Professional Information</Text>
          <CustomInput
            label="Specialization"
            placeholder="Enter your medical specialization"
            value={formData.specialization}
            onChangeText={(text) => updateFormField('specialization', text)}
            error={errors.specialization}
            leftIcon={<Ionicons name="medical-outline" size={20} color={COLORS.grey} />}
          />
          <CustomInput
            label="License Number"
            placeholder="Enter your medical license number"
            value={formData.licenseNumber}
            onChangeText={(text) => updateFormField('licenseNumber', text)}
            error={errors.licenseNumber}
            leftIcon={<Ionicons name="card-outline" size={20} color={COLORS.grey} />}
          />
          <Text style={styles.noteText}>
            Note: Your doctor account will require approval from an administrator before you can access all features.
          </Text>
        </View>
      )}
      
      {/* Show admin code field when admin role is selected */}
      {formData.role === 'admin' && (
        <View style={styles.additionalFields}>
          <Text style={styles.additionalFieldsTitle}>Administrator Verification</Text>
          <CustomInput
            label="Admin Code"
            placeholder="Enter the administrator code"
            value={formData.adminCode}
            onChangeText={(text) => updateFormField('adminCode', text)}
            error={errors.adminCode}
            secureTextEntry
            leftIcon={<Ionicons name="key-outline" size={20} color={COLORS.grey} />}
          />
          <Text style={styles.noteText}>
            Note: You must have a valid administrator code to register as an admin.
          </Text>
        </View>
      )}
      
      <View style={styles.buttonGroup}>
        <CustomButton
          title="Back"
          onPress={handlePrevStep}
          variant="outlined"
          style={[styles.button, styles.backButton]}
        />
        <CustomButton
          title="Register"
          onPress={handleRegistration}
          loading={isLoading}
          style={[styles.button, styles.registerButton]}
        />
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

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
              style={styles.backButtonNav}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Register</Text>
          </View>
          
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepDot,
                currentStep >= 1 && styles.activeStepDot,
              ]}
            />
            <View style={styles.stepLine} />
            <View
              style={[
                styles.stepDot,
                currentStep >= 2 && styles.activeStepDot,
              ]}
            />
          </View>
          
          {currentStep === 1 ? renderStepOne() : renderStepTwo()}
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
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
    marginBottom: SIZES.padding,
  },
  backButtonNav: {
    marginRight: SIZES.padding,
  },
  title: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding * 2,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.lightGrey,
  },
  activeStepDot: {
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    flex: 0.2,
    height: 2,
    backgroundColor: COLORS.lightGrey,
    marginHorizontal: SIZES.base,
  },
  form: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  roleCard: {
    width: '48%',
    padding: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  selectedRoleCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  roleTitle: {
    ...FONTS.titleSmall,
    color: COLORS.primary,
    marginTop: SIZES.base,
    marginBottom: SIZES.base / 2,
  },
  selectedRoleTitle: {
    color: COLORS.white,
  },
  roleDescription: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  adminRoleCard: {
    padding: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    marginBottom: SIZES.padding,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  button: {
    flex: 1,
  },
  backButton: {
    marginRight: SIZES.padding / 2,
  },
  registerButton: {
    marginLeft: SIZES.padding / 2,
  },
  errorContainer: {
    marginTop: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: COLORS.error + '20',
    borderRadius: SIZES.radiusMedium,
  },
  errorText: {
    ...FONTS.textMedium,
    color: COLORS.error,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding,
  },
  loginText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
  },
  loginLink: {
    ...FONTS.textMedium,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SIZES.base / 2,
  },
  additionalFields: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding * 2,
  },
  additionalFieldsTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  noteText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 