import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Common diseases in India
export const ALL_DISEASES = [
  {
    id: "dis1",
    name: "Tuberculosis (TB)",
    alternateNames: "Phthisis, Consumption",
    category: "Infectious Disease",
    chronic: true,
    prevalence: "High",
    affectedSystem: "Respiratory",
    description: "Infectious disease caused by Mycobacterium tuberculosis bacteria that primarily affects the lungs but can attack any part of the body",
    imageUrl: null,
  },
  {
    id: "dis2",
    name: "Type 2 Diabetes",
    alternateNames: "Diabetes Mellitus",
    category: "Metabolic Disorder",
    chronic: true,
    prevalence: "Very High",
    affectedSystem: "Endocrine",
    description: "Chronic condition affecting how the body metabolizes glucose, characterized by insulin resistance and high blood sugar levels",
    imageUrl: null,
  },
  {
    id: "dis3",
    name: "Hypertension",
    alternateNames: "High Blood Pressure",
    category: "Cardiovascular",
    chronic: true,
    prevalence: "Very High",
    affectedSystem: "Circulatory",
    description: "Medical condition where blood pressure in the arteries is persistently elevated, increasing risk of heart disease and stroke",
    imageUrl: null,
  },
  {
    id: "dis4",
    name: "Dengue Fever",
    alternateNames: "Breakbone Fever",
    category: "Infectious Disease",
    chronic: false,
    prevalence: "Seasonal",
    affectedSystem: "Multiple",
    description: "Mosquito-borne viral infection causing severe flu-like symptoms and potentially deadly complications",
    imageUrl: null,
  },
  {
    id: "dis5",
    name: "Malaria",
    alternateNames: "Plasmodium Infection",
    category: "Infectious Disease",
    chronic: false,
    prevalence: "High",
    affectedSystem: "Blood",
    description: "Life-threatening disease caused by parasites transmitted through the bite of infected female Anopheles mosquitoes",
    imageUrl: null,
  },
  {
    id: "dis6",
    name: "COPD",
    alternateNames: "Chronic Obstructive Pulmonary Disease",
    category: "Respiratory",
    chronic: true,
    prevalence: "High",
    affectedSystem: "Respiratory",
    description: "Progressive lung disease causing obstructed airflow from the lungs, typically caused by smoking or air pollution",
    imageUrl: null,
  },
  {
    id: "dis7",
    name: "Coronary Artery Disease",
    alternateNames: "CAD, Ischemic Heart Disease",
    category: "Cardiovascular",
    chronic: true,
    prevalence: "High",
    affectedSystem: "Circulatory",
    description: "Narrowing or blockage of coronary arteries, usually caused by atherosclerosis, reducing blood flow to the heart muscle",
    imageUrl: null,
  },
  {
    id: "dis8",
    name: "Chronic Kidney Disease",
    alternateNames: "CKD, Chronic Renal Disease",
    category: "Renal",
    chronic: true,
    prevalence: "Increasing",
    affectedSystem: "Urinary",
    description: "Gradual loss of kidney function over time, often associated with diabetes and hypertension",
    imageUrl: null,
  },
  {
    id: "dis9",
    name: "Iron Deficiency Anemia",
    alternateNames: "IDA",
    category: "Hematologic",
    chronic: true,
    prevalence: "Very High",
    affectedSystem: "Blood",
    description: "Condition where blood lacks adequate healthy red blood cells due to insufficient iron, common particularly in women and children",
    imageUrl: null,
  },
  {
    id: "dis10",
    name: "Typhoid Fever",
    alternateNames: "Enteric Fever",
    category: "Infectious Disease",
    chronic: false,
    prevalence: "Moderate",
    affectedSystem: "Digestive",
    description: "Bacterial infection caused by Salmonella typhi, spread through contaminated food and water",
    imageUrl: null,
  },
  {
    id: "dis11",
    name: "Asthma",
    alternateNames: "Bronchial Asthma",
    category: "Respiratory",
    chronic: true,
    prevalence: "High",
    affectedSystem: "Respiratory",
    description: "Chronic condition affecting airways in the lungs, characterized by inflammation and narrowing of the airways",
    imageUrl: null,
  },
  {
    id: "dis12",
    name: "Hepatitis B",
    alternateNames: "HBV",
    category: "Infectious Disease",
    chronic: true,
    prevalence: "Moderate",
    affectedSystem: "Digestive",
    description: "Viral infection affecting the liver, can lead to cirrhosis and liver cancer if it becomes chronic",
    imageUrl: null,
  },
  {
    id: "dis13",
    name: "HIV/AIDS",
    alternateNames: "Human Immunodeficiency Virus",
    category: "Infectious Disease",
    chronic: true,
    prevalence: "Significant",
    affectedSystem: "Immune",
    description: "Viral infection that progressively damages the immune system, making the body vulnerable to multiple infections and cancers",
    imageUrl: null,
  },
  {
    id: "dis14",
    name: "Diarrheal Diseases",
    alternateNames: "Gastroenteritis",
    category: "Infectious Disease",
    chronic: false,
    prevalence: "Very High",
    affectedSystem: "Digestive",
    description: "Group of conditions characterized by frequent loose watery stools, often caused by bacterial, viral, or parasitic infections",
    imageUrl: null,
  },
  {
    id: "dis15",
    name: "Rheumatoid Arthritis",
    alternateNames: "RA",
    category: "Autoimmune",
    chronic: true,
    prevalence: "Moderate",
    affectedSystem: "Musculoskeletal",
    description: "Chronic inflammatory disorder affecting multiple joints, causing pain, swelling, and eventual joint deformity",
    imageUrl: null,
  },
  {
    id: "dis16",
    name: "Cataracts",
    alternateNames: "Lens Opacity",
    category: "Ophthalmological",
    chronic: true,
    prevalence: "Very High",
    affectedSystem: "Ocular",
    description: "Clouding of the normally clear lens of the eye, leading to decreased vision, common in older adults",
    imageUrl: null,
  },
  {
    id: "dis17",
    name: "Depression",
    alternateNames: "Major Depressive Disorder",
    category: "Mental Health",
    chronic: true,
    prevalence: "High",
    affectedSystem: "Neurological",
    description: "Mental health disorder characterized by persistently depressed mood, loss of interest in activities, causing significant impairment in daily life",
    imageUrl: null,
  },
  {
    id: "dis18",
    name: "Chikungunya",
    alternateNames: "CHIKV",
    category: "Infectious Disease",
    chronic: false,
    prevalence: "Seasonal",
    affectedSystem: "Multiple",
    description: "Viral disease transmitted by infected mosquitoes, characterized by fever and severe joint pain",
    imageUrl: null,
  },
  {
    id: "dis19",
    name: "Hypothyroidism",
    alternateNames: "Underactive Thyroid",
    category: "Endocrine",
    chronic: true,
    prevalence: "High",
    affectedSystem: "Endocrine",
    description: "Condition in which the thyroid gland doesn't produce enough thyroid hormones, slowing down metabolism",
    imageUrl: null,
  },
  {
    id: "dis20",
    name: "GERD",
    alternateNames: "Gastroesophageal Reflux Disease",
    category: "Digestive",
    chronic: true,
    prevalence: "Increasing",
    affectedSystem: "Digestive",
    description: "Digestive disorder that affects the lower esophageal sphincter, causing stomach acid to flow back into the esophagus",
    imageUrl: null,
  }
];

export default function DiseasesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [diseases, setDiseases] = useState([]);
  const [filteredDiseases, setFilteredDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [selectedPrevalence, setSelectedPrevalence] = useState('all');

  // Simulate API data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setDiseases(ALL_DISEASES);
      setFilteredDiseases(ALL_DISEASES);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Extract unique affected systems and prevalence levels
  const affectedSystems = ['all', ...new Set(ALL_DISEASES.map(disease => disease.affectedSystem))];
  const prevalenceLevels = ['all', ...new Set(ALL_DISEASES.map(disease => disease.prevalence))];

  // Handle search and filtering
  useEffect(() => {
    let result = [...diseases];
    
    // Apply search query filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(disease => 
        disease.name.toLowerCase().includes(lowercasedQuery) || 
        disease.alternateNames.toLowerCase().includes(lowercasedQuery) ||
        disease.category.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply chronicity filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'chronic') {
        result = result.filter(disease => disease.chronic);
      } else if (selectedFilter === 'acute') {
        result = result.filter(disease => !disease.chronic);
      }
    }
    
    // Apply affected system filter
    if (selectedSystem !== 'all') {
      result = result.filter(disease => disease.affectedSystem === selectedSystem);
    }
    
    // Apply prevalence filter
    if (selectedPrevalence !== 'all') {
      result = result.filter(disease => disease.prevalence === selectedPrevalence);
    }
    
    setFilteredDiseases(result);
  }, [searchQuery, diseases, selectedFilter, selectedSystem, selectedPrevalence]);

  const renderDiseaseItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.diseaseCard} 
      onPress={() => router.push({
        pathname: '/disease-details',
        params: { id: item.id }
      })}
    >
      <View style={styles.diseaseImageContainer}>
        <Ionicons name="pulse" size={40} color={COLORS.accent} />
      </View>
      <View style={styles.diseaseInfo}>
        <Text style={styles.diseaseName}>{item.name}</Text>
        <Text style={styles.diseaseAlternate}>{item.alternateNames}</Text>
        <View style={styles.tagsContainer}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View style={[styles.systemTag, { backgroundColor: COLORS.primary + '20' }]}>
            <Text style={[styles.tagText, { color: COLORS.primary }]}>{item.affectedSystem}</Text>
          </View>
          <View style={[styles.prevalenceTag, { backgroundColor: COLORS.accent + '20' }]}>
            <Text style={[styles.tagText, { color: COLORS.accent }]}>{item.prevalence}</Text>
          </View>
        </View>
        <Text style={styles.diseaseDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );

  const renderChronicityFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity 
        style={[styles.filterButton, selectedFilter === 'all' && styles.filterActive]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, selectedFilter === 'chronic' && styles.filterActive]}
        onPress={() => setSelectedFilter('chronic')}
      >
        <Text style={[styles.filterText, selectedFilter === 'chronic' && styles.filterTextActive]}>
          Chronic
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, selectedFilter === 'acute' && styles.filterActive]}
        onPress={() => setSelectedFilter('acute')}
      >
        <Text style={[styles.filterText, selectedFilter === 'acute' && styles.filterTextActive]}>
          Acute
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSystemFilters = () => (
    <View style={styles.horizontalScrollContainer}>
      <FlatList
        horizontal
        data={affectedSystems}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalFiltersList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.filterButton, selectedSystem === item && styles.filterActive]}
            onPress={() => setSelectedSystem(item)}
          >
            <Text style={[styles.filterText, selectedSystem === item && styles.filterTextActive]}>
              {item === 'all' ? 'All Systems' : item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderPrevalenceFilters = () => (
    <View style={styles.horizontalScrollContainer}>
      <FlatList
        horizontal
        data={prevalenceLevels}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalFiltersList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.filterButton, selectedPrevalence === item && styles.filterActive]}
            onPress={() => setSelectedPrevalence(item)}
          >
            <Text style={[styles.filterText, selectedPrevalence === item && styles.filterTextActive]}>
              {item === 'all' ? 'All Prevalence' : item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical" size={60} color={COLORS.textLight} />
      <Text style={styles.emptyText}>No diseases found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diseases</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search diseases..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Disease Type</Text>
        {renderChronicityFilters()}
        
        <Text style={styles.filterSectionTitle}>Affected System</Text>
        {renderSystemFilters()}
        
        <Text style={styles.filterSectionTitle}>Prevalence</Text>
        {renderPrevalenceFilters()}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading diseases...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDiseases}
          renderItem={renderDiseaseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderListEmptyComponent}
          showsVerticalScrollIndicator={false}
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
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding / 2,
  },
  headerTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  backButton: {
    padding: SIZES.base,
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: SIZES.base,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: COLORS.text,
    ...FONTS.textRegular,
  },
  clearButton: {
    padding: SIZES.base,
  },
  filterSection: {
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  filterSectionTitle: {
    ...FONTS.textMedium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base,
    marginTop: SIZES.base,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding / 2,
  },
  horizontalScrollContainer: {
    marginBottom: SIZES.padding / 2,
  },
  horizontalFiltersList: {
    paddingRight: SIZES.padding * 2,
  },
  filterButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radiusMedium,
    marginRight: SIZES.base,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textLight,
    ...FONTS.textRegular,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  diseaseCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diseaseImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: 2,
  },
  diseaseAlternate: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  categoryTag: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
    alignSelf: 'flex-start',
    marginRight: SIZES.base / 2,
    marginBottom: SIZES.base / 2,
  },
  systemTag: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
    alignSelf: 'flex-start',
    marginRight: SIZES.base / 2,
    marginBottom: SIZES.base / 2,
  },
  prevalenceTag: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
    alignSelf: 'flex-start',
    marginBottom: SIZES.base / 2,
  },
  categoryText: {
    ...FONTS.caption,
    color: COLORS.accent,
  },
  tagText: {
    ...FONTS.caption,
  },
  diseaseDescription: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: SIZES.base,
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
  emptyContainer: {
    padding: SIZES.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...FONTS.titleSmall,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
  },
  emptySubtext: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
}); 