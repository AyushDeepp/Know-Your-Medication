import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import CustomInput from './components/CustomInput';
import CustomButton from './components/CustomButton';
import Card from './components/Card';
import ProfilePicture from './components/ProfilePicture';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import { API_URL } from './utils/config';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen() {
  const { user, logout, token } = useContext(AuthContext) || {};
  const [isEditing, setIsEditing] = useState(false);
  const [isMedicalInfoEditing, setIsMedicalInfoEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMedicalLoading, setIsMedicalLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.profile?.phoneNumber || '',
    address: user?.profile?.address || '',
    age: user?.profile?.age ? user.profile.age.toString() : '',
    gender: user?.profile?.gender || '',
    specialization: user?.profile?.specialization || '',
    licenseNumber: user?.profile?.licenseNumber || '',
  });
  
  const [medicalInfo, setMedicalInfo] = useState({
    bloodGroup: '',
    weight: '',
    height: '',
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    familyHistory: '',
    surgicalHistory: '',
  });
  
  const [errors, setErrors] = useState({});
  const [medicalErrors, setMedicalErrors] = useState({});
  
  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.profile?.phoneNumber || '',
        address: user.profile?.address || '',
        age: user.profile?.age ? user.profile.age.toString() : '',
        gender: user.profile?.gender || '',
        specialization: user.profile?.specialization || '',
        licenseNumber: user.profile?.licenseNumber || '',
      });
    }
  }, [user]);

  // Fetch user profile data
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const profile = response.data;
      console.log('Profile data fetched:', JSON.stringify(profile));
      
      // Store the complete profile data
      setProfile(profile);
      
      // Set profile picture if available
      if (profile.profilePicture) {
        setProfilePicture(`${API_URL}/${profile.profilePicture}`);
      }
      
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phoneNumber: profile.profile?.phoneNumber || '',
        address: profile.profile?.address || '',
        age: profile.profile?.age ? profile.profile.age.toString() : '',
        gender: profile.profile?.gender || '',
        specialization: profile.profile?.specialization || '',
        licenseNumber: profile.profile?.licenseNumber || '',
      });
      
      // Set medical information
      setMedicalInfo({
        bloodGroup: profile.profile?.bloodGroup || '',
        weight: profile.profile?.weight ? profile.profile.weight.toString() : '',
        height: profile.profile?.height ? profile.profile.height.toString() : '',
        // For allergies, prioritize allergiesText field if it exists
        allergies: profile.profile?.allergiesText || 
          (Array.isArray(profile.profile?.allergies) 
            ? profile.profile.allergies.map(a => a.name).join(', ') 
            : ''),
        // For chronic conditions, prioritize chronicConditions field if it exists
        chronicConditions: profile.profile?.chronicConditions || 
          (Array.isArray(profile.profile?.medicalConditions) 
            ? profile.profile.medicalConditions.map(c => c.condition).join(', ') 
            : ''),
        currentMedications: profile.profile?.currentMedications || '',
        familyHistory: profile.profile?.familyHistory || '',
        surgicalHistory: profile.profile?.surgicalHistory || '',
      });
      
      console.log('Processed medical info:', JSON.stringify(medicalInfo));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    }
  };
  
  // Load profile data on component mount
  useEffect(() => {
    if (token) {
      fetchProfileData();
    }
  }, [token]);
  
  const validate = () => {
    let validationErrors = {};
    
    if (!profileData.name.trim()) {
      validationErrors.name = 'Name is required';
    }
    
    if (!profileData.email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      validationErrors.email = 'Email is invalid';
    }
    
    // Only validate age if provided
    if (profileData.age && isNaN(parseInt(profileData.age))) {
      validationErrors.age = 'Age must be a number';
    }
    
    // For doctors, validate specialization and license number
    if (user?.role === 'doctor') {
      if (!profileData.specialization.trim()) {
        validationErrors.specialization = 'Specialization is required';
      }
      
      if (!profileData.licenseNumber.trim()) {
        validationErrors.licenseNumber = 'License number is required';
      }
    }
    
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };
  
  const validateMedicalInfo = () => {
    let validationErrors = {};
    
    // Validate weight and height as numbers if provided
    if (medicalInfo.weight && isNaN(parseFloat(medicalInfo.weight))) {
      validationErrors.weight = 'Weight must be a number';
    }
    
    if (medicalInfo.height && isNaN(parseFloat(medicalInfo.height))) {
      validationErrors.height = 'Height must be a number';
    }
    
    setMedicalErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };
  
  const handleUpdate = async () => {
    if (validate()) {
      try {
        setIsLoading(true);
        
        // Prepare update data
        const updateData = {
          name: profileData.name,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          address: profileData.address,
          age: profileData.age ? parseInt(profileData.age) : undefined,
          gender: profileData.gender,
        };
        
        // Add doctor-specific fields if user is a doctor
        if (user?.role === 'doctor') {
          updateData.specialization = profileData.specialization;
          updateData.licenseNumber = profileData.licenseNumber;
        }
        
        // Make API call to update profile
        const response = await axios.put(`${API_URL}/api/users/profile`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setIsLoading(false);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
        
        // Refresh profile data
        fetchProfileData();
      } catch (error) {
        console.error('Error updating profile:', error);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    }
  };
  
  const handleMedicalInfoUpdate = async () => {
    if (validateMedicalInfo()) {
      try {
        setIsMedicalLoading(true);
        
        // Format data for API
        const updateData = {
          bloodGroup: medicalInfo.bloodGroup,
          weight: medicalInfo.weight ? parseFloat(medicalInfo.weight) : null,
          height: medicalInfo.height ? parseFloat(medicalInfo.height) : null,
          allergiesText: medicalInfo.allergies,
          chronicConditions: medicalInfo.chronicConditions,
          currentMedications: medicalInfo.currentMedications,
          familyHistory: medicalInfo.familyHistory,
          surgicalHistory: medicalInfo.surgicalHistory,
        };
        
        console.log('Sending medical info update:', JSON.stringify(updateData));
        
        // Update user profile
        const response = await axios.put(
          `${API_URL}/api/users/medical-info`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('Medical info update response:', JSON.stringify(response.data));
        
        setIsMedicalLoading(false);
        setIsMedicalInfoEditing(false);
        Alert.alert('Success', 'Medical information updated successfully');
        
        // Refresh profile data
        fetchProfileData();
      } catch (error) {
        console.error('Error updating medical info:', error);
        setIsMedicalLoading(false);
        Alert.alert('Error', 'Failed to update medical information. Please try again.');
      }
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            if (logout) logout();
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  // Handle picking an image from gallery
  const pickImage = async () => {
    try {
      // Request permission if needed
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Upload the selected image
        uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Handle taking a photo with camera
  const takePhoto = async () => {
    try {
      // Request permission if needed
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Upload the taken photo
        uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  // Upload profile picture to server
  const uploadProfilePicture = async (uri) => {
    try {
      setIsUploadingImage(true);
      
      // Create form data for image upload
      const formData = new FormData();
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist');
        setIsUploadingImage(false);
        return;
      }
      
      // Get file name and extension
      const uriParts = uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      // Add the image to form data with proper type based on extension
      formData.append('profilePicture', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: `profile-picture.${fileExtension}`,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
      });
      
      // Log for debugging
      console.log('Image upload data:', {
        uri,
        extension: fileExtension,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
      });
      
      // Upload the image
      const response = await axios.post(`${API_URL}/api/users/profile-picture`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Set the new profile picture
      if (response.data && response.data.profilePicture) {
        setProfilePicture(`${API_URL}/${response.data.profilePicture}`);
        Alert.alert('Success', 'Profile picture updated successfully');
      }
      
      setIsUploadingImage(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error.response || error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
      setIsUploadingImage(false);
    }
  };
  
  // Delete profile picture
  const deleteProfilePicture = async () => {
    try {
      setIsUploadingImage(true);
      
      // Call API to delete profile picture
      await axios.delete(`${API_URL}/api/users/profile-picture`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Clear profile picture state
      setProfilePicture('');
      Alert.alert('Success', 'Profile picture removed successfully');
      setIsUploadingImage(false);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      Alert.alert('Error', 'Failed to delete profile picture. Please try again.');
      setIsUploadingImage(false);
    }
  };
  
  // Show image picker options
  const showImagePickerOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        ...(profilePicture ? [{ text: 'Remove Photo', onPress: deleteProfilePicture, style: 'destructive' }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderProfileInfo = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>Personal Information</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileImageContainer}>
        <TouchableOpacity onPress={showImagePickerOptions} style={styles.profileImageWrapper}>
          <ProfilePicture 
            uri={profilePicture}
            name={profileData.name}
            loading={isUploadingImage}
            showEditButton={true}
            role={user?.role}
          />
        </TouchableOpacity>
      </View>
      
      {/* Doctor approval status indicator */}
      {user?.role === 'doctor' && (
        <View style={[
          styles.approvalStatusContainer, 
          user?.isApproved ? styles.approvedContainer : styles.pendingContainer
        ]}>
          <Ionicons 
            name={user?.isApproved ? "checkmark-circle" : "time"} 
            size={20} 
            color={user?.isApproved ? COLORS.success : COLORS.warning} 
          />
          <View style={styles.approvalTextContainer}>
            <Text style={[
              styles.approvalStatusTitle,
              user?.isApproved ? styles.approvedText : styles.pendingText
            ]}>
              {user?.isApproved ? 'Account Approved' : 'Approval Pending'}
            </Text>
            {!user?.isApproved && (
              <Text style={styles.approvalMessage}>
                Administrator review is required before you can access all features.
              </Text>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Name</Text>
        <Text style={styles.infoValue}>{profileData.name}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email</Text>
        <Text style={styles.infoValue}>{profileData.email}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Phone</Text>
        <Text style={styles.infoValue}>{profileData.phoneNumber || 'Not set'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Address</Text>
        <Text style={styles.infoValue}>{profileData.address || 'Not set'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Age</Text>
        <Text style={styles.infoValue}>{profileData.age || 'Not set'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Gender</Text>
        <Text style={styles.infoValue}>{profileData.gender || 'Not set'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>User ID</Text>
        <Text style={styles.infoValue}>{profile?.userId || 'Not available'}</Text>
      </View>
      
      {user?.role === 'patient' && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Patient ID</Text>
          <Text style={styles.infoValue}>{profile?.patientId || 'Not available'}</Text>
        </View>
      )}
      
      {user?.role === 'doctor' && (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Doctor ID</Text>
            <Text style={styles.infoValue}>{profile?.doctorId || 'Not available'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Specialization</Text>
            <Text style={styles.infoValue}>{profileData.specialization || 'Not set'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License Number</Text>
            <Text style={styles.infoValue}>{profileData.licenseNumber || 'Not set'}</Text>
          </View>
        </>
      )}
      
      {user?.role === 'admin' && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Admin ID</Text>
          <Text style={styles.infoValue}>{profile?.adminId || 'Not available'}</Text>
        </View>
      )}
    </Card>
  );
  
  const renderMedicalInfo = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>Medical Information</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsMedicalInfoEditing(true)}
        >
          <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Blood Group</Text>
        <Text style={styles.infoValue}>{medicalInfo.bloodGroup || 'Not set'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Weight (kg)</Text>
        <Text style={styles.infoValue}>{medicalInfo.weight || 'Not set'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Height (cm)</Text>
        <Text style={styles.infoValue}>{medicalInfo.height || 'Not set'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Allergies</Text>
        <Text style={styles.infoValue}>{medicalInfo.allergies || 'None'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Chronic Conditions</Text>
        <Text style={styles.infoValue}>{medicalInfo.chronicConditions || 'None'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Current Medications</Text>
        <Text style={styles.infoValue}>{medicalInfo.currentMedications || 'None'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Family History</Text>
        <Text style={styles.infoValue}>{medicalInfo.familyHistory || 'Not provided'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Surgical History</Text>
        <Text style={styles.infoValue}>{medicalInfo.surgicalHistory || 'None'}</Text>
      </View>
    </Card>
  );
  
  const renderEditForm = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(false)}
        >
          <Ionicons name="close-outline" size={20} color={COLORS.text} />
          <Text style={styles.editText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      <CustomInput
        label="Name"
        placeholder="Enter your name"
        value={profileData.name}
        onChangeText={(text) => setProfileData({...profileData, name: text})}
        error={errors.name}
      />
      
      <CustomInput
        label="Email"
        placeholder="Enter your email"
        value={profileData.email}
        onChangeText={(text) => setProfileData({...profileData, email: text})}
        keyboardType="email-address"
        error={errors.email}
      />
      
      <CustomInput
        label="Phone Number"
        placeholder="Enter your phone number"
        value={profileData.phoneNumber}
        onChangeText={(text) => setProfileData({...profileData, phoneNumber: text})}
        keyboardType="phone-pad"
        error={errors.phoneNumber}
      />
      
      <CustomInput
        label="Address"
        placeholder="Enter your address"
        value={profileData.address}
        onChangeText={(text) => setProfileData({...profileData, address: text})}
        error={errors.address}
      />
      
      <CustomInput
        label="Age"
        placeholder="Enter your age"
        value={profileData.age}
        onChangeText={(text) => setProfileData({...profileData, age: text})}
        keyboardType="numeric"
        error={errors.age}
      />
      
      <CustomInput
        label="Gender"
        placeholder="Enter your gender"
        value={profileData.gender}
        onChangeText={(text) => setProfileData({...profileData, gender: text})}
        error={errors.gender}
      />
      
      {user?.role === 'doctor' && (
        <>
          <CustomInput
            label="Specialization"
            placeholder="Enter your specialization"
            value={profileData.specialization}
            onChangeText={(text) => setProfileData({...profileData, specialization: text})}
            error={errors.specialization}
          />
          
          <CustomInput
            label="License Number"
            placeholder="Enter your license number"
            value={profileData.licenseNumber}
            onChangeText={(text) => setProfileData({...profileData, licenseNumber: text})}
            error={errors.licenseNumber}
          />
        </>
      )}
      
      <CustomButton
        title={isLoading ? 'Updating...' : 'Update Profile'}
        onPress={handleUpdate}
        disabled={isLoading}
        loading={isLoading}
        style={styles.updateButton}
      />
    </Card>
  );
  
  const renderMedicalInfoEditForm = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>Edit Medical Information</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsMedicalInfoEditing(false)}
        >
          <Ionicons name="close-outline" size={20} color={COLORS.text} />
          <Text style={styles.editText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      <CustomInput
        label="Blood Group"
        placeholder="E.g., A+, B-, O+, AB+"
        value={medicalInfo.bloodGroup}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, bloodGroup: text})}
        error={medicalErrors.bloodGroup}
        style={styles.medicalInput}
      />
      
      <CustomInput
        label="Weight (kg)"
        placeholder="E.g., 70"
        value={medicalInfo.weight}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, weight: text})}
        keyboardType="numeric"
        error={medicalErrors.weight}
        style={styles.medicalInput}
      />
      
      <CustomInput
        label="Height (cm)"
        placeholder="E.g., 175"
        value={medicalInfo.height}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, height: text})}
        keyboardType="numeric"
        error={medicalErrors.height}
        style={styles.medicalInput}
      />
      
      <CustomInput
        label="Allergies"
        placeholder="List any allergies separated by commas"
        value={medicalInfo.allergies}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, allergies: text})}
        multiline
        numberOfLines={3}
        error={medicalErrors.allergies}
        style={styles.medicalInput}
      />
      
      <CustomInput
        label="Chronic Conditions"
        placeholder="List any chronic conditions"
        value={medicalInfo.chronicConditions}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, chronicConditions: text})}
        multiline
        numberOfLines={3}
        error={medicalErrors.chronicConditions}
        style={styles.medicalInput}
      />
      
      <CustomInput
        label="Current Medications"
        placeholder="List any medications you are currently taking"
        value={medicalInfo.currentMedications}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, currentMedications: text})}
        multiline
        numberOfLines={3}
        error={medicalErrors.currentMedications}
        style={styles.medicalInput}
      />
      
      <CustomInput
        label="Family Medical History"
        placeholder="Any relevant family medical history"
        value={medicalInfo.familyHistory}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, familyHistory: text})}
        multiline
        numberOfLines={3}
        error={medicalErrors.familyHistory}
        style={styles.medicalInput}
      />
      
      <CustomInput
        label="Surgical History"
        placeholder="Past surgeries and procedures"
        value={medicalInfo.surgicalHistory}
        onChangeText={(text) => setMedicalInfo({...medicalInfo, surgicalHistory: text})}
        multiline
        numberOfLines={3}
        error={medicalErrors.surgicalHistory}
        style={styles.medicalInput}
      />
      
      <CustomButton
        title={isMedicalLoading ? 'Updating...' : 'Update Medical Information'}
        onPress={handleMedicalInfoUpdate}
        disabled={isMedicalLoading}
        loading={isMedicalLoading}
        style={styles.updateButton}
      />
    </Card>
  );

  const renderMenuOptions = () => {
    // Return different menu options depending on user role
    if (user?.role === 'patient') {
    return (
      <Card style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/my-medications')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="medkit-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>My Medications</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/prescriptions')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.menuText}>My Prescriptions</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/lab-reports')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="flask-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.menuText}>Lab Reports</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/my-doctors')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="people-outline" size={24} color={COLORS.purple} />
            </View>
            <Text style={styles.menuText}>My Doctors</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/emergency-contacts')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="alert-circle-outline" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.menuText}>Emergency Contacts</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        </Card>
      );
    } else if (user?.role === 'doctor') {
      return (
        <Card style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/patients')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>My Patients</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/doctor-requests')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.menuText}>Patient Requests</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        </Card>
      );
    } else if (user?.role === 'admin') {
      return (
        <Card style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/manage-users')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Manage Users</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/doctor-approvals')}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.menuText}>Doctor Approvals</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
      </Card>
    );
    } else {
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Profile</Text>
        </View>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>
        
        {isEditing ? renderEditForm() : renderProfileInfo()}
        
        {user?.role === 'patient' && (
          isMedicalInfoEditing ? renderMedicalInfoEditForm() : renderMedicalInfo()
        )}
        
        {renderMenuOptions()}
        
        <Card style={[styles.menuCard, styles.lastCard]}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            </View>
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  logoutButton: {
    ...FONTS.textMedium,
    marginLeft: 'auto',
  },
  scrollView: {
    padding: SIZES.padding * 2,
  },
  scrollContent: {
    paddingBottom: SIZES.padding * 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...FONTS.titleMedium,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  userName: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  roleBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
  },
  roleText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  profileCard: {
    marginBottom: SIZES.padding * 2,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  profileTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
  },
  approvalStatusContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
  },
  approvedContainer: {
    backgroundColor: COLORS.success + '20',
  },
  pendingContainer: {
    backgroundColor: COLORS.warning + '20',
  },
  approvalTextContainer: {
    flex: 1,
    marginLeft: SIZES.padding,
  },
  approvalStatusTitle: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
  },
  approvedText: {
    color: COLORS.success,
  },
  pendingText: {
    color: COLORS.warning,
  },
  approvalMessage: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginTop: 2,
  },
  infoLabel: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    width: 100,
  },
  infoValue: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  updateButton: {
    marginTop: SIZES.padding,
  },
  menuCard: {
    marginBottom: SIZES.padding * 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey + '40',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGrey + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  menuText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    ...FONTS.textMedium,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  lastCard: {
    marginBottom: 0,
  },
  medicalInput: {
    marginBottom: SIZES.padding,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
  },
  editProfileImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary + '80',
    borderRadius: 20,
    padding: 4,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGrey + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 