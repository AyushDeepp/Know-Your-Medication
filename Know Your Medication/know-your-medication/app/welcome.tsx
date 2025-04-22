import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/university-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Know Your Medication</Text>
          <Text style={styles.subtitle}>Your Digital Health Companion</Text>
        </View>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="medical-outline" size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Medication Information</Text>
            <Text style={styles.featureDescription}>
              Access detailed information about medications, dosage, side effects, and more
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="document-text-outline" size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Digital Prescriptions</Text>
            <Text style={styles.featureDescription}>
              Receive digital prescriptions from your doctors and access them anytime
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Connect with Doctors</Text>
            <Text style={styles.featureDescription}>
              Stay connected with your healthcare providers for better care
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="flask-outline" size={32} color={COLORS.primary} />
            <Text style={styles.featureTitle}>Lab Reports</Text>
            <Text style={styles.featureDescription}>
              Access your lab reports digitally and keep track of your health
            </Text>
          </View>
        </View>
        
        <View style={styles.userTypesContainer}>
          <Text style={styles.sectionTitle}>For Everyone in Healthcare</Text>
          
          <View style={styles.userTypesList}>
            <View style={[styles.userType, { backgroundColor: COLORS.patient + '20' }]}>
              <Ionicons name="person-outline" size={24} color={COLORS.patient} />
              <Text style={styles.userTypeTitle}>Patients</Text>
              <Text style={styles.userTypeDescription}>
                Access prescriptions, lab reports, and medical information
              </Text>
            </View>
            
            <View style={[styles.userType, { backgroundColor: COLORS.doctor + '20' }]}>
              <Ionicons name="medkit-outline" size={24} color={COLORS.doctor} />
              <Text style={styles.userTypeTitle}>Doctors</Text>
              <Text style={styles.userTypeDescription}>
                Manage patients, create prescriptions, and share reports
              </Text>
            </View>
            
            <View style={[styles.userType, { backgroundColor: COLORS.admin + '20' }]}>
              <Ionicons name="settings-outline" size={24} color={COLORS.admin} />
              <Text style={styles.userTypeTitle}>Administrators</Text>
              <Text style={styles.userTypeDescription}>
                Oversee the system, manage users, and approve doctor registrations
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding * 2,
    paddingTop: SIZES.padding * 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 3,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: SIZES.padding,
  },
  title: {
    ...FONTS.titleLarge,
    color: COLORS.text,
    marginTop: SIZES.padding,
  },
  subtitle: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginTop: SIZES.base,
  },
  featuresContainer: {
    marginBottom: SIZES.padding * 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding * 1.5,
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureTitle: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginLeft: SIZES.padding,
  },
  featureDescription: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    flex: 2,
    marginLeft: SIZES.padding,
  },
  userTypesContainer: {
    marginBottom: SIZES.padding * 3,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  userTypesList: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  userType: {
    padding: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.padding,
  },
  userTypeTitle: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.base,
    marginBottom: SIZES.base / 2,
  },
  userTypeDescription: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  footer: {
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    backgroundColor: COLORS.background,
  },
  getStartedButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    paddingVertical: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedText: {
    ...FONTS.button,
    color: COLORS.white,
    marginRight: SIZES.base,
  },
  loginButton: {
    marginTop: SIZES.padding,
    alignItems: 'center',
  },
  loginText: {
    ...FONTS.textMedium,
    color: COLORS.primary,
  },
}); 