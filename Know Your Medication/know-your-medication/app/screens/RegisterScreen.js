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
} from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient', // Default role
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register, error } = useContext(AuthContext);

  const updateFormField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateStep1 = () => {
    let validationErrors = {};
    
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
    
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleRegistration = async () => {
    setIsLoading(true);
    
    try {
      // Add profile data based on role
      let profileData = {};
      
      // In a real app, you would collect more profile data based on role
      if (formData.role === 'doctor') {
        profileData = {
          specialization: '',
          licenseNumber: '',
        };
      }
      
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...profileData,
      };
      
      const success = await register(userData);
      
      setIsLoading(false);
      if (success) {
        // Navigation will be handled by the auth context navigation container
        // Show confirmation for doctors that their account needs approval
        if (formData.role === 'doctor') {
          // In a real app, show a confirmation message that admin needs to approve
        }
      }
    } catch (error) {
      setIsLoading(false);
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
              style={styles.backButton}
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
};

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
  backButton: {
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
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lightGrey,
    marginHorizontal: SIZES.base,
  },
  form: {
    marginTop: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding * 2,
  },
  roleCard: {
    width: '48%',
    borderRadius: SIZES.radiusMedium,
    borderWidth: 2,
    borderColor: COLORS.lightGrey,
    padding: SIZES.padding,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedRoleCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  roleTitle: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SIZES.base,
    marginBottom: SIZES.base,
  },
  roleDescription: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  selectedRoleTitle: {
    color: COLORS.white,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    marginTop: SIZES.padding,
  },
  backButton: {
    width: '48%',
  },
  registerButton: {
    width: '48%',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding * 2,
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

export default RegisterScreen; 