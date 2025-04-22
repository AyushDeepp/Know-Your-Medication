import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from './components/Card';
import axios from 'axios';
import { API_URL } from './utils/config';

// Prescription Item Component
const PrescriptionItem = ({ item, onPress }) => (
  <Card style={styles.prescriptionCard} onPress={onPress} shadow="medium">
    <View style={styles.prescriptionHeader}>
      <View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.doctorName}>
          Dr. {item.doctorId.name}
        </Text>
      </View>
      <View style={styles.iconContainer}>
        <Ionicons name="document-text" size={24} color={COLORS.accent} />
      </View>
    </View>
    
    {item.symptoms && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        <Text style={styles.sectionText}>{item.symptoms}</Text>
      </View>
    )}

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Medications</Text>
      {item.medications.map((med, index) => (
        <View key={index} style={styles.medicationItem}>
          <Text style={styles.medicationName}>{med.medicationName}</Text>
          <Text style={styles.medicationDetails}>
            {med.dosage} - {med.frequency}
            {med.duration ? ` for ${med.duration}` : ''}
          </Text>
          {med.instructions && (
            <Text style={styles.instructions}>{med.instructions}</Text>
          )}
        </View>
      ))}
    </View>

    {item.notes && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Doctor's Notes</Text>
        <Text style={styles.sectionText}>{item.notes}</Text>
      </View>
    )}
  </Card>
);

export default function PrescriptionsScreen() {
  const { userToken } = useContext(AuthContext);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrescriptions = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/api/prescriptions/patient`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      setPrescriptions(response.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions. Please try again later.');
      Alert.alert('Error', 'Could not load your prescriptions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [userToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrescriptions();
  };

  const viewPrescriptionDetails = (prescription) => {
    // This could be implemented later to navigate to a detailed view
    // For now, we'll just display the data in the list item
    console.log('View prescription:', prescription._id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
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

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPrescriptions}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : prescriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={COLORS.grey} />
          <Text style={styles.emptyText}>No prescriptions yet</Text>
          <Text style={styles.emptySubText}>
            Prescriptions from your doctors will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={({ item }) => (
            <PrescriptionItem 
              item={item} 
              onPress={() => viewPrescriptionDetails(item)}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  errorText: {
    ...FONTS.textMedium,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
  retryButton: {
    marginTop: SIZES.padding,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
  },
  retryButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.titleMedium,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
  },
  emptySubText: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.base,
  },
  list: {
    padding: SIZES.padding,
  },
  prescriptionCard: {
    marginBottom: SIZES.padding,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  dateText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  doctorName: {
    ...FONTS.titleSmall,
    color: COLORS.text,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.textMedium,
    fontWeight: '500',
    color: COLORS.textLight,
    marginBottom: SIZES.base / 2,
  },
  sectionText: {
    ...FONTS.textRegular,
    color: COLORS.text,
  },
  medicationItem: {
    marginBottom: SIZES.base,
    paddingBottom: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  medicationName: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  medicationDetails: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginTop: 2,
  },
  instructions: {
    ...FONTS.textSmall,
    color: COLORS.accent,
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 