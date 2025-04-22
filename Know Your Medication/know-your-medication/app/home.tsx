import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import Card from './components/Card';
import ProfilePicture from './components/ProfilePicture';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import apiClient from './utils/apiClient';

const menuOptions = {
  common: [
    {
      id: 'profile',
      title: 'My Profile',
      icon: 'person-outline',
      color: COLORS.primary,
      description: 'View and update your profile information',
      screen: 'profile',
    },
    {
      id: 'medications',
      title: 'Medications',
      icon: 'medical-outline',
      color: COLORS.info,
      description: 'Browse and search medications information',
      screen: 'medications',
    },
    {
      id: 'diseases',
      title: 'Diseases',
      icon: 'pulse-outline',
      color: COLORS.accent,
      description: 'Browse and search information about diseases',
      screen: 'diseases',
    },
  ],
  patient: [
    {
      id: 'mymeds',
      title: 'My Medications',
      icon: 'fitness-outline',
      color: COLORS.warning,
      description: 'View your current and past medications',
      screen: 'my-medications',
    },
    {
      id: 'prescriptions',
      title: 'My Prescriptions',
      icon: 'document-text-outline',
      color: COLORS.success,
      description: 'View your prescriptions',
      screen: 'my-prescriptions',
    },
    {
      id: 'mydoctors',
      title: 'My Doctors',
      icon: 'people-outline',
      color: COLORS.success,
      description: 'View doctors managing your care',
      screen: 'my-doctors',
    },
    {
      id: 'labreports',
      title: 'Lab Reports',
      icon: 'flask-outline',
      color: COLORS.accent,
      description: 'View and download your lab reports',
      screen: 'lab-reports',
    },
  ],
  doctor: [
    {
      id: 'patients',
      title: 'My Patients',
      icon: 'people-outline',
      color: COLORS.accent,
      description: 'Manage and view your patients',
      screen: 'patients',
    },
    {
      id: 'createprescription',
      title: 'Create Prescription',
      icon: 'create-outline',
      color: COLORS.info,
      description: 'Create new prescriptions for your patients',
      screen: 'create-prescription',
    },
    {
      id: 'uploadreport',
      title: 'Upload Lab Report',
      icon: 'cloud-upload-outline',
      color: COLORS.yellow,
      description: 'Upload lab reports for your patients',
      screen: 'upload-report',
    },
  ],
  admin: [
    {
      id: 'manageusers',
      title: 'Manage Users',
      icon: 'people-outline',
      color: COLORS.accent,
      description: 'Manage all users in the system',
      screen: 'manage-users',
    },
    {
      id: 'doctorrequests',
      title: 'Doctor Requests',
      icon: 'person-add-outline',
      color: COLORS.info,
      description: 'Review and approve doctor registration requests',
      screen: 'doctor-requests',
    },
    {
      id: 'uploadreport',
      title: 'Upload Lab Report',
      icon: 'cloud-upload-outline',
      color: COLORS.yellow,
      description: 'Upload lab reports for patients',
      screen: 'upload-report',
    },
  ],
};

export default function HomeScreen() {
  const { user, token } = useContext(AuthContext) || {};
  const [greeting, setGreeting] = useState('');
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  
  // Get user-specific menu options
  const getUserOptions = () => {
    const options = [...menuOptions.common];
    
    if (user?.role === 'patient') {
      options.push(...menuOptions.patient);
    } else if (user?.role === 'doctor') {
      // Check if doctor is approved
      if (user?.isApproved) {
        options.push(...menuOptions.doctor);
      } else {
        // For unapproved doctors, add the menu options but mark them as disabled
        options.push(...menuOptions.doctor.map(option => ({
          ...option,
          disabled: true,
          description: 'Approval required to use this feature'
        })));
      }
    } else if (user?.role === 'admin') {
      options.push(...menuOptions.admin);
    }
    
    return options;
  };
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let greetingText = '';
    
    if (hour < 12) {
      greetingText = 'Good Morning';
    } else if (hour < 18) {
      greetingText = 'Good Afternoon';
    } else {
      greetingText = 'Good Evening';
    }
    
    setGreeting(greetingText);
  }, []);

  // Fetch recent prescriptions for patients
  useEffect(() => {
    if (user?.role === 'patient') {
      fetchRecentPrescriptions();
    }
  }, [user]);
  
  const fetchRecentPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const response = await apiClient.get('/api/prescriptions/patient?limit=3');
      setRecentPrescriptions(response.data);
      setLoadingPrescriptions(false);
    } catch (error) {
      console.error('Error fetching recent prescriptions:', error);
      setLoadingPrescriptions(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderPrescriptionItem = ({ item }) => (
    <Card style={styles.prescriptionCard}>
      <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/prescription-details',
          params: { prescriptionId: item._id }
        })}
      >
        <View style={styles.prescriptionHeader}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          <Text style={styles.prescriptionTitle}>
            {item.diagnosis || 'General Prescription'}
          </Text>
        </View>
        
        <View style={styles.prescriptionDetails}>
          <Text style={styles.prescriptionDoctor}>
            Dr. {item.doctorId?.name || 'Unknown Doctor'}
          </Text>
          <Text style={styles.prescriptionDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderMenuItem = ({ item }) => (
    <Card
      style={[
        styles.menuItem,
        item.disabled && styles.disabledMenuItem
      ]}
      onPress={() => {
        if (item.disabled) {
          // Show approval warning alert for disabled items
          Alert.alert(
            'Approval Required',
            'This feature requires administrator approval of your doctor account before use.',
            [{ text: 'OK' }]
          );
        } else {
          router.push(item.screen);
        }
      }}
      shadow="medium"
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={28} color={item.disabled ? COLORS.lightGrey : item.color} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemTitle, item.disabled && styles.disabledText]}>{item.title}</Text>
        <Text style={[styles.menuItemDescription, item.disabled && styles.disabledText]}>{item.description}</Text>
      </View>
      {item.disabled ? (
        <Ionicons name="lock-closed" size={20} color={COLORS.lightGrey} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <ProfilePicture 
            uri={user?.profilePicture}
            name={user?.name} 
            size={50}
            role={user?.role}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
      
      {/* Warning banner for unapproved doctors */}
      {user?.role === 'doctor' && !user?.isApproved && (
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={24} color={COLORS.white} />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Account Pending Approval</Text>
            <Text style={styles.warningText}>
              Some features are restricted until an administrator approves your account.
            </Text>
          </View>
        </View>
      )}
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {user?.role === 'patient' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
              <TouchableOpacity onPress={() => router.push('my-prescriptions')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {loadingPrescriptions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : recentPrescriptions.length > 0 ? (
              <FlatList
                data={recentPrescriptions}
                renderItem={renderPrescriptionItem}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.prescriptionsList}
              />
            ) : (
              <Card style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={30} color={COLORS.lightGrey} />
                <Text style={styles.emptyText}>No prescriptions yet</Text>
              </Card>
            )}
          </>
        )}
        
        <Text style={styles.sectionTitle}>Quick Access</Text>
        
        <FlatList
          data={getUserOptions()}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
  },
  greeting: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
  },
  userName: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  roleBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: SIZES.base / 2,
  },
  roleText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginHorizontal: SIZES.padding * 2,
  },
  warningBanner: {
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    padding: SIZES.padding,
    marginHorizontal: SIZES.padding * 2,
    marginTop: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: SIZES.padding,
  },
  warningTitle: {
    ...FONTS.textMedium,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  warningText: {
    ...FONTS.textSmall,
    color: COLORS.white,
    marginTop: 2,
  },
  content: {
    padding: SIZES.padding * 2,
    paddingBottom: SIZES.padding * 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginVertical: SIZES.padding,
  },
  seeAllText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionsList: {
    paddingBottom: SIZES.padding,
  },
  prescriptionCard: {
    width: 220,
    marginRight: SIZES.padding,
    padding: SIZES.padding,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  prescriptionTitle: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginLeft: SIZES.base,
    flex: 1,
  },
  prescriptionDetails: {
    marginTop: SIZES.base,
  },
  prescriptionDoctor: {
    ...FONTS.textSmall,
    color: COLORS.accent,
  },
  prescriptionDate: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  emptyText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginTop: SIZES.base,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  menuItemDescription: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  disabledMenuItem: {
    backgroundColor: COLORS.lightGrey + '20',
  },
  disabledText: {
    color: COLORS.lightGrey,
  },
}); 