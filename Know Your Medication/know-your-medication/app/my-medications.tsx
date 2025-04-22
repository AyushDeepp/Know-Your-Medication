import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './context/AuthContext';

// Mock prescription medications data
const MOCK_PATIENT_MEDICATIONS = [
  {
    id: "pm1",
    medicationId: "med1",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    duration: "3 months",
    status: "active",
    prescriptionId: "pr123",
    startDate: "2023-10-15",
    endDate: "2024-01-15",
    doctorName: "Dr. Sarah Johnson",
    instructions: "Take in the morning with food"
  },
  {
    id: "pm2",
    medicationId: "med2",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "6 months",
    status: "active",
    prescriptionId: "pr124",
    startDate: "2023-11-01",
    endDate: "2024-05-01",
    doctorName: "Dr. Michael Chen",
    instructions: "Take with meals"
  },
  {
    id: "pm3",
    medicationId: "med5",
    name: "Ibuprofen",
    dosage: "400mg",
    frequency: "As needed",
    duration: "2 weeks",
    status: "active",
    prescriptionId: "pr125",
    startDate: "2023-12-10",
    endDate: "2023-12-24",
    doctorName: "Dr. Sarah Johnson",
    instructions: "Take for pain, do not exceed 3 tablets in 24 hours"
  },
  {
    id: "pm4",
    medicationId: "med3",
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily",
    duration: "3 months",
    status: "completed",
    prescriptionId: "pr120",
    startDate: "2023-07-01",
    endDate: "2023-10-01",
    doctorName: "Dr. Michael Chen",
    instructions: "Take at bedtime"
  },
  {
    id: "pm5",
    medicationId: "med7",
    name: "Omeprazole",
    dosage: "20mg",
    frequency: "Once daily",
    duration: "1 month",
    status: "completed",
    prescriptionId: "pr121",
    startDate: "2023-08-15",
    endDate: "2023-09-15",
    doctorName: "Dr. Sarah Johnson",
    instructions: "Take 30 minutes before breakfast"
  }
];

export default function MyMedicationsScreen() {
  const { user } = useContext(AuthContext) || {};
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  
  // Simulate API call to get patient medications
  useEffect(() => {
    const fetchPatientMedications = async () => {
      try {
        // In a real app, fetch from API:
        // const response = await fetch(`${API_URL}/patient/medications`, {
        //   headers: { Authorization: `Bearer ${user.token}` }
        // });
        // const data = await response.json();
        // setMedications(data);
        
        // For demo purposes, we'll use mock data
        setTimeout(() => {
          setMedications(MOCK_PATIENT_MEDICATIONS);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching medications:', error);
        setLoading(false);
        Alert.alert('Error', 'Could not load your medications. Please try again later.');
      }
    };

    fetchPatientMedications();
  }, []);

  const getCurrentMedications = () => {
    return medications.filter(med => med.status === 'active');
  };

  const getPastMedications = () => {
    return medications.filter(med => med.status === 'completed');
  };

  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.medicationCard} 
      onPress={() => router.push(`/medication-details?id=${item.medicationId}`)}
    >
      <View style={styles.medicationHeader}>
        <View style={styles.nameContainer}>
          <Text style={styles.medicationName}>{item.name}</Text>
          <Text style={styles.medicationDosage}>{item.dosage} · {item.frequency}</Text>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
        </View>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.medicationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>{item.doctorName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>{item.instructions}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.viewPrescriptionButton}
        onPress={() => router.push(`/prescription?id=${item.prescriptionId}`)}
      >
        <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
        <Text style={styles.viewPrescriptionText}>View Prescription</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical" size={60} color={COLORS.textLight} />
      <Text style={styles.emptyText}>
        {activeTab === 'current' 
          ? 'No current medications' 
          : 'No past medications'}
      </Text>
      <Text style={styles.emptySubText}>
        {activeTab === 'current'
          ? 'You don\'t have any active medications'
          : 'You don\'t have any completed medications'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Medications</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'current' && styles.activeTabText
          ]}>
            Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'past' && styles.activeTabText
          ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your medications...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'current' ? getCurrentMedications() : getPastMedications()}
          renderItem={renderMedicationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  backButton: {
    padding: SIZES.base,
  },
  headerTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
  },
  listContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 4,
  },
  medicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  medicationName: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  medicationDosage: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  chevronContainer: {
    padding: SIZES.base,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: SIZES.base,
  },
  medicationDetails: {
    marginTop: SIZES.base,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  detailText: {
    ...FONTS.textSmall,
    color: COLORS.text,
    marginLeft: SIZES.base,
    flex: 1,
  },
  viewPrescriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.base,
    marginTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
  viewPrescriptionText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SIZES.base / 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 4,
  },
  emptyText: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
  },
  emptySubText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
}); 