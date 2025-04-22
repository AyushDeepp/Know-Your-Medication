import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ALL_MEDICATIONS } from './medications';

// Define the medication type to match our data structure
interface Medication {
  id: string;
  name: string;
  genericName: string;
  classification: string;
  prescriptionRequired: boolean;
  description: string;
  imageUrl: string | null;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  sideEffects: string;
  contraindications: string;
  usageInstructions: string;
  storageConditions: string;
  category: string;
}

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMedicationDetails = async () => {
      try {
        // For demo purposes, we'll use the data from our medications list
        setTimeout(() => {
          const foundMedication = ALL_MEDICATIONS.find(med => med.id === id);
          if (foundMedication) {
            setMedication(foundMedication as Medication);
          } else {
            Alert.alert('Error', 'Medication not found');
          }
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching medication details:', error);
        setLoading(false);
        Alert.alert('Error', 'Could not load medication details. Please try again later.');
      }
    };

    if (id) {
      fetchMedicationDetails();
    } else {
      setLoading(false);
      Alert.alert('Error', 'No medication ID provided');
    }
  }, [id]);

  const renderSection = (title: string, content: string | string[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof content === 'string' ? (
        <Text style={styles.sectionText}>{content}</Text>
      ) : (
        <View style={styles.listContainer}>
          {content.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading medication details...</Text>
      </SafeAreaView>
    );
  }

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medication Not Found</Text>
          <View style={styles.placeholderButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>Medication information not available</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Details</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.medicationHeader}>
          <View style={styles.medicationImageContainer}>
            {medication.imageUrl ? (
              <Image source={{ uri: medication.imageUrl }} style={styles.medicationImage} />
            ) : (
              <Ionicons name="medkit" size={60} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.medicationTitleContainer}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationGeneric}>{medication.genericName}</Text>
            
            <View style={styles.badgeContainer}>
              <View style={styles.classificationBadge}>
                <Text style={styles.classificationText}>{medication.classification}</Text>
              </View>
              <View style={[
                styles.prescriptionBadge, 
                medication.prescriptionRequired ? styles.rxBadge : styles.otcBadge
              ]}>
                <Text style={styles.prescriptionText}>
                  {medication.prescriptionRequired ? 'Prescription Required' : 'Over-the-Counter'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.quickInfoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="business-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>Manufacturer: {medication.manufacturer}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flask-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>Form: {medication.dosageForm}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="fitness-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>Strength: {medication.strength}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>Category: {medication.category}</Text>
          </View>
        </View>
        
        {renderSection('Description', medication.description)}
        
        {renderSection('Usage Instructions', medication.usageInstructions)}
        
        {renderSection('Side Effects', medication.sideEffects.split(', '))}
        
        {renderSection('Contraindications', medication.contraindications.split(', '))}
        
        {renderSection('Storage Conditions', medication.storageConditions)}
        
        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle" size={20} color={COLORS.textLight} />
          <Text style={styles.disclaimerText}>
            The information provided is for educational purposes only and is not intended as medical advice.
            Always consult with a healthcare professional before taking any medication.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
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
  scrollContent: {
    flex: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  medicationImageContainer: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  medicationImage: {
    width: 90,
    height: 90,
    borderRadius: SIZES.radiusMedium,
  },
  medicationTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  medicationName: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
  },
  medicationGeneric: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginBottom: SIZES.base,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.base,
  },
  classificationBadge: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    marginRight: SIZES.base,
    marginBottom: SIZES.base,
  },
  classificationText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  prescriptionBadge: {
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    marginBottom: SIZES.base,
  },
  rxBadge: {
    backgroundColor: COLORS.error + '15',
  },
  otcBadge: {
    backgroundColor: COLORS.success + '15',
  },
  prescriptionText: {
    ...FONTS.textSmall,
    fontWeight: '500',
    color: COLORS.text,
  },
  quickInfoContainer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.lightGrey + '30',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  infoText: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginLeft: SIZES.base,
  },
  section: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  sectionText: {
    ...FONTS.textMedium,
    color: COLORS.text,
    lineHeight: 22,
  },
  listContainer: {
    marginTop: SIZES.base / 2,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: SIZES.base,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    marginRight: SIZES.base,
  },
  listItemText: {
    ...FONTS.textMedium,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },
  disclaimerContainer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.lightGrey + '30',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.padding * 2,
  },
  disclaimerText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    flex: 1,
    marginLeft: SIZES.base,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorText: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radiusMedium,
    marginTop: SIZES.padding,
  },
  goBackButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    fontWeight: '500',
  },
}); 