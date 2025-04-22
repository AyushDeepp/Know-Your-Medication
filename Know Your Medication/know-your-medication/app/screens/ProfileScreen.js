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
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    phoneNumber: userInfo?.profile?.phoneNumber || '',
    address: userInfo?.profile?.address || '',
    age: userInfo?.profile?.age ? userInfo.profile.age.toString() : '',
    gender: userInfo?.profile?.gender || '',
    specialization: userInfo?.profile?.specialization || '',
    licenseNumber: userInfo?.profile?.licenseNumber || '',
  });
  
  const [errors, setErrors] = useState({});
  
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/users/profile');
      const profile = response.data;
      
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
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log('Error fetching profile:', error);
    }
  };
  
  // Fetch profile data when screen loads
  useEffect(() => {
    fetchProfileData();
  }, []);
  
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
    if (userInfo?.role === 'doctor') {
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
        if (userInfo?.role === 'doctor') {
          updateData.specialization = profileData.specialization;
          updateData.licenseNumber = profileData.licenseNumber;
        }
        
        await api.put('/api/users/profile', updateData);
        
        setIsLoading(false);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } catch (error) {
        setIsLoading(false);
        Alert.alert('Error', 'Failed to update profile');
        console.log('Error updating profile:', error);
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
          onPress: logout,
          style: 'destructive',
        },
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
      
      <View style={styles.profileItem}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profileData.name}</Text>
      </View>
      
      <View style={styles.profileItem}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profileData.email}</Text>
      </View>
      
      <View style={styles.profileItem}>
        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>
          {profileData.phoneNumber || 'Not provided'}
        </Text>
      </View>
      
      <View style={styles.profileItem}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>
          {profileData.address || 'Not provided'}
        </Text>
      </View>
      
      <View style={styles.profileItem}>
        <Text style={styles.label}>Age</Text>
        <Text style={styles.value}>
          {profileData.age || 'Not provided'}
        </Text>
      </View>
      
      <View style={styles.profileItem}>
        <Text style={styles.label}>Gender</Text>
        <Text style={styles.value}>
          {profileData.gender || 'Not provided'}
        </Text>
      </View>
      
      {userInfo?.role === 'doctor' && (
        <>
          <View style={styles.divider} />
          
          <Text style={styles.profileTitle}>Professional Information</Text>
          
          <View style={styles.profileItem}>
            <Text style={styles.label}>Specialization</Text>
            <Text style={styles.value}>
              {profileData.specialization || 'Not provided'}
            </Text>
          </View>
          
          <View style={styles.profileItem}>
            <Text style={styles.label}>License Number</Text>
            <Text style={styles.value}>
              {profileData.licenseNumber || 'Not provided'}
            </Text>
          </View>
        </>
      )}
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
          <Ionicons name="close-outline" size={20} color={COLORS.error} />
          <Text style={[styles.editText, { color: COLORS.error }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      <CustomInput
        label="Name"
        placeholder="Enter your name"
        value={profileData.name}
        onChangeText={(text) => setProfileData({ ...profileData, name: text })}
        error={errors.name}
      />
      
      <CustomInput
        label="Email"
        placeholder="Enter your email"
        value={profileData.email}
        onChangeText={(text) => setProfileData({ ...profileData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      
      <CustomInput
        label="Phone Number"
        placeholder="Enter your phone number"
        value={profileData.phoneNumber}
        onChangeText={(text) => setProfileData({ ...profileData, phoneNumber: text })}
        keyboardType="phone-pad"
      />
      
      <CustomInput
        label="Address"
        placeholder="Enter your address"
        value={profileData.address}
        onChangeText={(text) => setProfileData({ ...profileData, address: text })}
        multiline
        numberOfLines={2}
      />
      
      <CustomInput
        label="Age"
        placeholder="Enter your age"
        value={profileData.age}
        onChangeText={(text) => setProfileData({ ...profileData, age: text })}
        keyboardType="numeric"
        error={errors.age}
      />
      
      <CustomInput
        label="Gender"
        placeholder="Enter your gender"
        value={profileData.gender}
        onChangeText={(text) => setProfileData({ ...profileData, gender: text })}
      />
      
      {userInfo?.role === 'doctor' && (
        <>
          <View style={styles.divider} />
          
          <Text style={styles.profileTitle}>Professional Information</Text>
          
          <CustomInput
            label="Specialization"
            placeholder="Enter your specialization"
            value={profileData.specialization}
            onChangeText={(text) => setProfileData({ ...profileData, specialization: text })}
            error={errors.specialization}
          />
          
          <CustomInput
            label="License Number"
            placeholder="Enter your license number"
            value={profileData.licenseNumber}
            onChangeText={(text) => setProfileData({ ...profileData, licenseNumber: text })}
            error={errors.licenseNumber}
          />
        </>
      )}
      
      <CustomButton
        title="Update Profile"
        onPress={handleUpdate}
        loading={isLoading}
        style={styles.updateButton}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color={COLORS.primary} />
          </View>
          
          <Text style={styles.userName}>{userInfo?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userInfo?.role.charAt(0).toUpperCase() + userInfo?.role.slice(1)}
            </Text>
          </View>
          
          {userInfo?.role === 'doctor' && !userInfo?.isApproved && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending Approval</Text>
            </View>
          )}
        </View>
        
        {isEditing ? renderEditForm() : renderProfileInfo()}
        
        <CustomButton
          title="Logout"
          onPress={handleLogout}
          variant="outlined"
          color={COLORS.error}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

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
  backButton: {
    marginRight: SIZES.padding,
  },
  title: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  content: {
    padding: SIZES.padding * 2,
    paddingBottom: SIZES.padding * 4,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  avatarContainer: {
    marginBottom: SIZES.padding,
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
  pendingBadge: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    marginTop: SIZES.base,
  },
  pendingText: {
    ...FONTS.textSmall,
    color: COLORS.warning,
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
  profileItem: {
    marginBottom: SIZES.padding,
  },
  label: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  value: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: SIZES.padding,
  },
  updateButton: {
    marginTop: SIZES.padding,
  },
  logoutButton: {
    marginTop: SIZES.padding,
  },
});

export default ProfileScreen; 