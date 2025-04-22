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
import { ALL_DISEASES } from './diseases';

// Define the disease type to match our data structure
interface Disease {
  id: string;
  name: string;
  alternateNames: string;
  category: string;
  chronic: boolean;
  prevalence: string;
  affectedSystem: string;
  description: string;
  imageUrl: string | null;
}

export default function DiseaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [disease, setDisease] = useState<Disease | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDiseaseDetails = async () => {
      try {
        // For demo purposes, we'll use the data from our diseases list
        setTimeout(() => {
          const foundDisease = ALL_DISEASES.find(dis => dis.id === id);
          if (foundDisease) {
            setDisease(foundDisease as Disease);
          } else {
            Alert.alert('Error', 'Disease not found');
          }
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching disease details:', error);
        setLoading(false);
        Alert.alert('Error', 'Could not load disease details. Please try again later.');
      }
    };

    if (id) {
      fetchDiseaseDetails();
    } else {
      setLoading(false);
      Alert.alert('Error', 'No disease ID provided');
    }
  }, [id]);

  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionText}>{content}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading disease details...</Text>
      </SafeAreaView>
    );
  }

  if (!disease) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Disease Not Found</Text>
          <View style={styles.placeholderButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>Disease information not available</Text>
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
        <Text style={styles.headerTitle}>Disease Details</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.diseaseHeader}>
          <View style={styles.diseaseIconContainer}>
            <Ionicons name="pulse" size={60} color={COLORS.accent} />
          </View>
          <View style={styles.diseaseTitleContainer}>
            <Text style={styles.diseaseName}>{disease.name}</Text>
            <Text style={styles.diseaseAlternateName}>{disease.alternateNames}</Text>
            
            <View style={styles.tagsContainer}>
              <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{disease.category}</Text>
              </View>
              <View style={[
                styles.typeTag, 
                disease.chronic ? styles.chronicTag : styles.acuteTag
              ]}>
                <Text style={styles.typeText}>
                  {disease.chronic ? 'Chronic' : 'Acute'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.quickInfoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="body-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>System: {disease.affectedSystem}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="stats-chart-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>Prevalence: {disease.prevalence}</Text>
          </View>
        </View>
        
        {renderSection('Description', disease.description)}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Conditions</Text>
          <View style={styles.relatedContainer}>
            {ALL_DISEASES
              .filter(d => d.affectedSystem === disease.affectedSystem && d.id !== disease.id)
              .slice(0, 3)
              .map(relatedDisease => (
                <TouchableOpacity 
                  key={relatedDisease.id}
                  style={styles.relatedDiseaseItem}
                  onPress={() => {
                    router.push({
                      pathname: '/disease-details',
                      params: { id: relatedDisease.id }
                    });
                  }}
                >
                  <Ionicons name="medical-outline" size={24} color={COLORS.accent} />
                  <View style={styles.relatedDiseaseInfo}>
                    <Text style={styles.relatedDiseaseName}>{relatedDisease.name}</Text>
                    <Text style={styles.relatedDiseaseCategory}>{relatedDisease.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              ))}
          </View>
        </View>
        
        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle" size={20} color={COLORS.textLight} />
          <Text style={styles.disclaimerText}>
            The information provided is for educational purposes only and is not intended as medical advice.
            Always consult with a healthcare professional for proper diagnosis and treatment.
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
  headerTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
  },
  backButton: {
    padding: SIZES.base,
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  diseaseHeader: {
    flexDirection: 'row',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  diseaseIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  diseaseTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  diseaseName: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginBottom: 4,
  },
  diseaseAlternateName: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginBottom: SIZES.base,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.base,
  },
  categoryTag: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    marginRight: SIZES.base,
    marginBottom: SIZES.base / 2,
  },
  categoryText: {
    ...FONTS.textSmall,
    color: COLORS.accent,
    fontWeight: '500',
  },
  typeTag: {
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    marginBottom: SIZES.base / 2,
  },
  chronicTag: {
    backgroundColor: COLORS.primary + '20',
  },
  acuteTag: {
    backgroundColor: COLORS.error + '20',
  },
  typeText: {
    ...FONTS.textSmall,
    fontWeight: '500',
  },
  quickInfoContainer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.lightGrey + '30',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  relatedContainer: {
    marginTop: SIZES.base,
  },
  relatedDiseaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  relatedDiseaseInfo: {
    flex: 1,
    marginLeft: SIZES.base,
  },
  relatedDiseaseName: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: '500',
  },
  relatedDiseaseCategory: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
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