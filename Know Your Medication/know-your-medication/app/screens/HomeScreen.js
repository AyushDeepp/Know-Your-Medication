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
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import Card from '../components/Card';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const menuOptions = {
  common: [
    {
      id: 'medications',
      title: 'Medications',
      icon: 'medical-outline',
      color: COLORS.primary,
      description: 'Search and view medication details',
      screen: 'Medications',
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      color: COLORS.green,
      description: 'View and update your profile information',
      screen: 'Profile',
    },
  ],
  patient: [
    {
      id: 'prescriptions',
      title: 'My Prescriptions',
      icon: 'document-text-outline',
      color: COLORS.accent,
      description: 'View prescriptions from your doctors',
      screen: 'Prescriptions',
    },
    {
      id: 'labreports',
      title: 'Lab Reports',
      icon: 'flask-outline',
      color: COLORS.info,
      description: 'View your lab test reports',
      screen: 'LabReports',
    },
    {
      id: 'mydoctors',
      title: 'My Doctors',
      icon: 'people-outline',
      color: COLORS.yellow,
      description: 'View doctors who have added you as a patient',
      screen: 'MyDoctors',
    },
    {
      id: 'emergency',
      title: 'Emergency Contacts',
      icon: 'call-outline',
      color: COLORS.error,
      description: 'Manage your emergency contacts',
      screen: 'EmergencyContacts',
    },
  ],
  doctor: [
    {
      id: 'patients',
      title: 'My Patients',
      icon: 'people-outline',
      color: COLORS.accent,
      description: 'Manage and view your patients',
      screen: 'Patients',
    },
    {
      id: 'createprescription',
      title: 'Create Prescription',
      icon: 'create-outline',
      color: COLORS.info,
      description: 'Create new prescriptions for your patients',
      screen: 'CreatePrescription',
    },
    {
      id: 'uploadreport',
      title: 'Upload Lab Report',
      icon: 'cloud-upload-outline',
      color: COLORS.yellow,
      description: 'Upload lab reports for your patients',
      screen: 'UploadReport',
    },
  ],
  admin: [
    {
      id: 'manageusers',
      title: 'Manage Users',
      icon: 'people-outline',
      color: COLORS.accent,
      description: 'Manage all users in the system',
      screen: 'ManageUsers',
    },
    {
      id: 'doctorrequests',
      title: 'Doctor Requests',
      icon: 'person-add-outline',
      color: COLORS.info,
      description: 'Review and approve doctor registration requests',
      screen: 'DoctorRequests',
    },
    {
      id: 'uploadreport',
      title: 'Upload Lab Report',
      icon: 'cloud-upload-outline',
      color: COLORS.yellow,
      description: 'Upload lab reports for patients',
      screen: 'UploadReport',
    },
  ],
};

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [greeting, setGreeting] = useState('');
  
  // Get user-specific menu options
  const getUserOptions = () => {
    const options = [...menuOptions.common];
    
    if (userInfo?.role === 'patient') {
      options.push(...menuOptions.patient);
    } else if (userInfo?.role === 'doctor') {
      options.push(...menuOptions.doctor);
    } else if (userInfo?.role === 'admin') {
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

  const renderMenuItem = ({ item }) => (
    <Card
      style={styles.menuItem}
      onPress={() => navigation.navigate(item.screen)}
      shadow="medium"
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        <Text style={styles.menuItemDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{userInfo?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userInfo?.role.charAt(0).toUpperCase() + userInfo?.role.slice(1)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={50} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
};

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
  content: {
    padding: SIZES.padding * 2,
    paddingBottom: SIZES.padding * 4,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.padding,
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
});

export default HomeScreen; 