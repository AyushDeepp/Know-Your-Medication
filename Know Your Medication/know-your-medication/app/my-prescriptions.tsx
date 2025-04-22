import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import apiClient from './utils/apiClient';
import { API_URL } from './utils/config';
import Card from './components/Card';

export default function MyPrescriptionsScreen() {
  const { token } = useContext(AuthContext) || {};
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      console.log('Fetching prescriptions...');
      
      // Get the user ID
      let userId = '';
      try {
        const userData = await apiClient.get('/api/users/me');
        userId = userData.data._id;
        console.log('Got user ID:', userId);
      } catch (userError) {
        console.error('Error getting user ID:', userError);
        // Continue with other endpoints if user ID can't be fetched
      }
      
      let prescriptions = [];
      let endpointWorked = false;
      
      // Try endpoint 1: my-prescriptions with ID
      if (userId) {
        try {
          console.log('Trying admin endpoint for patient prescriptions');
          const response = await apiClient.get(`/api/prescriptions/admin/patient/${userId}`);
          console.log('Admin endpoint successful:', response.data.length, 'items');
          prescriptions = response.data;
          endpointWorked = true;
        } catch (error1) {
          console.error('Admin endpoint failed:', error1.message);
          
          try {
            console.log('Trying /my-prescriptions endpoint with ID');
            const response = await apiClient.get(`/api/prescriptions/my-prescriptions/${userId}`);
            console.log('my-prescriptions endpoint successful:', response.data.length, 'items');
            prescriptions = response.data;
            endpointWorked = true;
          } catch (error2) {
            console.error('my-prescriptions endpoint failed:', error2.message);
            
            // Try endpoint 2: patient/:id endpoint
            try {
              console.log('Trying /patient/:id endpoint');
              const response = await apiClient.get(`/api/prescriptions/patient/${userId}`);
              console.log('patient/:id endpoint successful:', response.data.length, 'items');
              prescriptions = response.data;
              endpointWorked = true;
            } catch (error3) {
              console.error('patient/:id endpoint failed:', error3.message);
            }
          }
        }
      }
      
      // Try endpoint 3: patient endpoint (fallback)
      if (!endpointWorked) {
        try {
          console.log('Trying /patient endpoint');
          const response = await apiClient.get('/api/prescriptions/patient');
          console.log('patient endpoint successful:', response.data.length, 'items');
          prescriptions = response.data;
          endpointWorked = true;
        } catch (error3) {
          console.error('patient endpoint failed:', error3.message);
        }
      }
      
      if (endpointWorked) {
        setPrescriptions(prescriptions);
      } else {
        console.error('All prescription endpoints failed');
        Alert.alert(
          'Error', 
          'Failed to load prescriptions. Please try again later.',
          [{ text: 'OK' }]
        );
        setPrescriptions([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Outer error fetching prescriptions:', error);
      Alert.alert(
        'Error', 
        'Failed to load prescriptions. Please try again later.',
        [{ text: 'OK' }]
      );
      setPrescriptions([]);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderPrescriptionItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.prescriptionCard} 
      onPress={() => router.push({
        pathname: '/prescription-details',
        params: { prescriptionId: item._id }
      })}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionTitleContainer}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
          <Text style={styles.prescriptionTitle}>
            {item.diagnosis || item.symptoms?.slice(0, 25) || 'General Prescription'}
          </Text>
        </View>
        <Text style={styles.prescriptionDate}>{formatDate(item.createdAt)}</Text>
      </View>
      
      <View style={styles.doctorInfo}>
        <Ionicons name="medkit-outline" size={16} color={COLORS.accent} />
        <Text style={styles.doctorName}>
          Dr. {item.doctorId?.name || 'Unknown Doctor'}
        </Text>
        {item.doctorId?.profile?.specialization && (
          <Text style={styles.specialization}>
            ({item.doctorId.profile.specialization})
          </Text>
        )}
      </View>
      
      <View style={styles.divider} />
      
      <Text style={styles.medicationsLabel}>Medications:</Text>
      {item.medications.slice(0, 3).map((med: any, index: number) => (
        <View key={index} style={styles.medicationItem}>
          <Text style={styles.medicationName}>{med.medicationName}</Text>
          <Text style={styles.medicationDetails}>
            {med.dosage} - {med.frequency}
          </Text>
        </View>
      ))}
      
      {item.medications.length > 3 && (
        <Text style={styles.moreMedications}>+{item.medications.length - 3} more</Text>
      )}
      
      <View style={styles.viewDetailsContainer}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={60} color={COLORS.lightGrey} />
      <Text style={styles.emptyTitle}>No Prescriptions</Text>
      <Text style={styles.emptyMessage}>
        You don't have any prescriptions yet.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <View style={styles.emptyBox} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescriptionItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          onRefresh={fetchPrescriptions}
          refreshing={loading}
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
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  emptyBox: {
    width: 32,
    height: 32,
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
    paddingBottom: SIZES.padding * 2,
  },
  prescriptionCard: {
    marginBottom: SIZES.padding,
    overflow: 'hidden',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  prescriptionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prescriptionTitle: {
    ...FONTS.textLarge,
    color: COLORS.text,
    marginLeft: SIZES.base,
    flex: 1,
  },
  prescriptionDate: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  doctorName: {
    ...FONTS.textSmall,
    color: COLORS.accent,
    marginLeft: SIZES.base / 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: SIZES.base,
  },
  specialization: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: SIZES.base,
    fontStyle: 'italic',
  },
  medicationsLabel: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginBottom: SIZES.base,
  },
  medicationItem: {
    marginBottom: SIZES.base / 2,
  },
  medicationName: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  medicationDetails: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  moreMedications: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    marginTop: SIZES.base / 2,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SIZES.padding,
  },
  viewDetailsText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    marginRight: SIZES.base / 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  emptyMessage: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
}); 