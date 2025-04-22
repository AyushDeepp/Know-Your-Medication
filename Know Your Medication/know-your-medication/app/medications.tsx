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

// Popular medications in India
export const ALL_MEDICATIONS = [
  {
    id: "med1",
    name: "Crocin",
    genericName: "Paracetamol",
    classification: "Analgesic/Antipyretic",
    prescriptionRequired: false,
    description: "Used for fever, headaches, and mild to moderate pain relief",
    imageUrl: null,
    manufacturer: "GSK",
    dosageForm: "Tablet",
    strength: "500mg, 650mg",
    sideEffects: "Rare but may include nausea, skin rash, liver damage with overdose",
    contraindications: "Liver disease, alcoholism, sensitivity to paracetamol",
    usageInstructions: "Adults: 1-2 tablets every 4-6 hours as needed, not exceeding 4g daily",
    storageConditions: "Store below 30°C in a dry place, away from direct light",
    category: "OTC Analgesic"
  },
  {
    id: "med2",
    name: "Allegra",
    genericName: "Fexofenadine",
    classification: "Antihistamine",
    prescriptionRequired: false,
    description: "Used to treat allergy symptoms such as runny nose, watery eyes, sneezing, hives, and itching",
    imageUrl: null,
    manufacturer: "Sanofi",
    dosageForm: "Tablet",
    strength: "120mg, 180mg",
    sideEffects: "Drowsiness (rare), headache, nausea, dizziness",
    contraindications: "Hypersensitivity to fexofenadine, kidney disease",
    usageInstructions: "Adults: One 120mg tablet twice daily or one 180mg tablet once daily",
    storageConditions: "Store at room temperature away from moisture",
    category: "Non-sedating Antihistamine"
  },
  {
    id: "med3",
    name: "Saridon",
    genericName: "Paracetamol + Propyphenazone + Caffeine",
    classification: "Analgesic Combination",
    prescriptionRequired: false,
    description: "Used for relief from headache, migraine, toothache, body ache, and fever",
    imageUrl: null,
    manufacturer: "Bayer",
    dosageForm: "Tablet",
    strength: "250mg + 150mg + 50mg",
    sideEffects: "Gastric irritation, insomnia, nervousness due to caffeine",
    contraindications: "Liver or kidney disease, peptic ulcer, severe cardiovascular disorders",
    usageInstructions: "Adults: 1 tablet every 6 hours as needed, maximum 3 tablets daily",
    storageConditions: "Store in a cool, dry place below 25°C",
    category: "Combination Pain Reliever"
  },
  {
    id: "med4",
    name: "Vicks Action 500",
    genericName: "Paracetamol + Phenylephrine + Caffeine",
    classification: "Cold/Flu Medication",
    prescriptionRequired: false,
    description: "Used for temporary relief of cold and flu symptoms",
    imageUrl: null,
    manufacturer: "P&G",
    dosageForm: "Tablet",
    strength: "500mg + 10mg + 25mg",
    sideEffects: "Increased heart rate, nervousness, difficulty sleeping",
    contraindications: "Hypertension, hyperthyroidism, heart disease",
    usageInstructions: "Adults: 1 tablet every 6 hours with water, not exceeding 4 tablets daily",
    storageConditions: "Store below 30°C, protect from light and moisture",
    category: "Cold Medication"
  },
  {
    id: "med5",
    name: "Pantocid",
    genericName: "Pantoprazole",
    classification: "Proton Pump Inhibitor",
    prescriptionRequired: true,
    description: "Used to treat excess stomach acid conditions like GERD, heartburn, and ulcers",
    imageUrl: null,
    manufacturer: "Sun Pharma",
    dosageForm: "Tablet",
    strength: "20mg, 40mg",
    sideEffects: "Headache, diarrhea, nausea, stomach pain, dizziness",
    contraindications: "Hypersensitivity to pantoprazole, liver disease",
    usageInstructions: "Adults: 40mg once daily for 4-8 weeks for GERD, taken before breakfast",
    storageConditions: "Store at room temperature away from moisture and heat",
    category: "Gastric Acid Reducer"
  },
  {
    id: "med6",
    name: "Glycomet",
    genericName: "Metformin",
    classification: "Antidiabetic",
    prescriptionRequired: true,
    description: "Used to control blood sugar levels in type 2 diabetes",
    imageUrl: null,
    manufacturer: "USV",
    dosageForm: "Tablet",
    strength: "500mg, 850mg, 1000mg",
    sideEffects: "Nausea, vomiting, diarrhea, gas, loss of appetite",
    contraindications: "Kidney disease, liver disease, heart failure, diabetic ketoacidosis",
    usageInstructions: "Initially 500mg twice daily with meals, may be increased gradually",
    storageConditions: "Store at room temperature away from moisture and heat",
    category: "Oral Hypoglycemic Agent"
  },
  {
    id: "med7",
    name: "Ecosprin",
    genericName: "Aspirin",
    classification: "Antiplatelet",
    prescriptionRequired: true,
    description: "Used to prevent blood clots and reduce the risk of heart attack and stroke",
    imageUrl: null,
    manufacturer: "USV",
    dosageForm: "Tablet",
    strength: "75mg, 150mg",
    sideEffects: "Stomach irritation, heartburn, nausea, easy bruising, bleeding",
    contraindications: "Bleeding disorders, gastric ulcers, aspirin allergy, children under 12",
    usageInstructions: "Adults: 75-150mg once daily with food to reduce stomach irritation",
    storageConditions: "Store below 25°C in a dry place",
    category: "Cardiovascular Agent"
  },
  {
    id: "med8",
    name: "Atorva",
    genericName: "Atorvastatin",
    classification: "Statin",
    prescriptionRequired: true,
    description: "Used to lower cholesterol and reduce the risk of heart disease",
    imageUrl: null,
    manufacturer: "Zydus",
    dosageForm: "Tablet",
    strength: "10mg, 20mg, 40mg, 80mg",
    sideEffects: "Muscle pain, mild memory problems, liver enzyme elevation",
    contraindications: "Liver disease, pregnancy, breastfeeding",
    usageInstructions: "Take once daily at any time of day, with or without food",
    storageConditions: "Store at room temperature away from moisture and heat",
    category: "Lipid-Lowering Agent"
  },
  {
    id: "med9",
    name: "Azithral",
    genericName: "Azithromycin",
    classification: "Antibiotic",
    prescriptionRequired: true,
    description: "Used to treat bacterial infections of the respiratory system, ear, and skin",
    imageUrl: null,
    manufacturer: "Alembic",
    dosageForm: "Tablet",
    strength: "250mg, 500mg",
    sideEffects: "Diarrhea, nausea, abdominal pain, headache",
    contraindications: "Liver disease, heart rhythm disorders, myasthenia gravis",
    usageInstructions: "Adults: 500mg on day 1, then 250mg once daily for 4 days",
    storageConditions: "Store at room temperature away from moisture",
    category: "Macrolide Antibiotic"
  },
  {
    id: "med10",
    name: "Combiflam",
    genericName: "Ibuprofen + Paracetamol",
    classification: "NSAID + Analgesic",
    prescriptionRequired: false,
    description: "Used for relief from pain and fever",
    imageUrl: null,
    manufacturer: "Sanofi",
    dosageForm: "Tablet",
    strength: "400mg + 325mg",
    sideEffects: "Stomach upset, heartburn, dizziness, headache",
    contraindications: "Peptic ulcer, severe kidney/liver disease, heart failure",
    usageInstructions: "Adults: 1 tablet every 6 hours as needed, maximum 3 tablets daily",
    storageConditions: "Store below 30°C in a dry place",
    category: "Combination Pain Reliever"
  },
  {
    id: "med11",
    name: "Montek LC",
    genericName: "Montelukast + Levocetirizine",
    classification: "Antiasthmatic + Antihistamine",
    prescriptionRequired: true,
    description: "Used for treatment of allergic rhinitis and asthma",
    imageUrl: null,
    manufacturer: "Sun Pharma",
    dosageForm: "Tablet",
    strength: "10mg + 5mg",
    sideEffects: "Headache, drowsiness, fatigue, dry mouth",
    contraindications: "Severe liver disease, kidney impairment",
    usageInstructions: "Adults: 1 tablet daily in the evening",
    storageConditions: "Store below 25°C, protect from light and moisture",
    category: "Respiratory Medication"
  },
  {
    id: "med12",
    name: "Aciloc",
    genericName: "Ranitidine",
    classification: "H2 Receptor Antagonist",
    prescriptionRequired: false,
    description: "Used to reduce stomach acid production and treat GERD, ulcers, and heartburn",
    imageUrl: null,
    manufacturer: "Cadila",
    dosageForm: "Tablet",
    strength: "150mg, 300mg",
    sideEffects: "Headache, dizziness, constipation, diarrhea",
    contraindications: "Kidney or liver disease, porphyria",
    usageInstructions: "Adults: 150mg twice daily or 300mg at bedtime",
    storageConditions: "Store at room temperature away from moisture and heat",
    category: "Gastric Acid Reducer"
  },
  {
    id: "med13",
    name: "Telma",
    genericName: "Telmisartan",
    classification: "Angiotensin Receptor Blocker",
    prescriptionRequired: true,
    description: "Used to treat high blood pressure and protect kidneys in diabetics",
    imageUrl: null,
    manufacturer: "Glenmark",
    dosageForm: "Tablet",
    strength: "20mg, 40mg, 80mg",
    sideEffects: "Dizziness, back pain, sinus inflammation, diarrhea",
    contraindications: "Pregnancy, severe liver disease, biliary obstruction",
    usageInstructions: "Adults: Usually 40mg once daily, may be adjusted based on response",
    storageConditions: "Store below 30°C in a dry place",
    category: "Antihypertensive"
  },
  {
    id: "med14",
    name: "Dolo 650",
    genericName: "Paracetamol",
    classification: "Analgesic/Antipyretic",
    prescriptionRequired: false,
    description: "Used for relief from fever and mild to moderate pain",
    imageUrl: null,
    manufacturer: "Micro Labs",
    dosageForm: "Tablet",
    strength: "650mg",
    sideEffects: "Rare but may include nausea, skin rash, liver damage with overdose",
    contraindications: "Liver disease, alcoholism, sensitivity to paracetamol",
    usageInstructions: "Adults: 1 tablet every 4-6 hours as needed, not exceeding 4 tablets daily",
    storageConditions: "Store below 30°C in a dry place",
    category: "OTC Analgesic"
  },
  {
    id: "med15",
    name: "Shelcal",
    genericName: "Calcium Carbonate + Vitamin D3",
    classification: "Calcium Supplement",
    prescriptionRequired: false,
    description: "Used to prevent and treat calcium deficiency",
    imageUrl: null,
    manufacturer: "Torrent",
    dosageForm: "Tablet",
    strength: "500mg + 250IU",
    sideEffects: "Constipation, gas, bloating, calcium stones in susceptible individuals",
    contraindications: "Hypercalcemia, kidney stones, excessive vitamin D",
    usageInstructions: "Adults: 1 tablet twice daily preferably after meals",
    storageConditions: "Store in a cool, dry place away from direct sunlight",
    category: "Nutritional Supplement"
  },
  {
    id: "med16",
    name: "Evion",
    genericName: "Vitamin E",
    classification: "Vitamin Supplement",
    prescriptionRequired: false,
    description: "Used as an antioxidant and for vitamin E deficiency",
    imageUrl: null,
    manufacturer: "Merck",
    dosageForm: "Capsule",
    strength: "200mg, 400mg, 600mg",
    sideEffects: "Nausea, diarrhea, stomach cramps, fatigue, weakness, headache",
    contraindications: "Vitamin K deficiency, bleeding disorders",
    usageInstructions: "Adults: 400mg daily or as directed by physician",
    storageConditions: "Store below 25°C, protect from light and moisture",
    category: "Nutritional Supplement"
  },
  {
    id: "med17",
    name: "Thyronorm",
    genericName: "Levothyroxine",
    classification: "Thyroid Hormone",
    prescriptionRequired: true,
    description: "Used to treat hypothyroidism",
    imageUrl: null,
    manufacturer: "Abbott",
    dosageForm: "Tablet",
    strength: "25mcg, 50mcg, 75mcg, 100mcg, 125mcg, 150mcg",
    sideEffects: "Headache, insomnia, nervousness, irritability, weight loss, heart palpitations",
    contraindications: "Adrenal insufficiency, thyrotoxicosis, acute myocardial infarction",
    usageInstructions: "Take on empty stomach, 30-60 minutes before breakfast",
    storageConditions: "Store at room temperature away from moisture and heat",
    category: "Hormone Replacement"
  },
  {
    id: "med18",
    name: "Pan D",
    genericName: "Pantoprazole + Domperidone",
    classification: "Proton Pump Inhibitor + Antiemetic",
    prescriptionRequired: true,
    description: "Used to treat acidity, GERD, and gastric ulcers",
    imageUrl: null,
    manufacturer: "Alkem",
    dosageForm: "Tablet",
    strength: "40mg + 30mg",
    sideEffects: "Headache, dizziness, abdominal pain, diarrhea, constipation",
    contraindications: "Liver disease, intestinal obstruction, prolactin-dependent tumors",
    usageInstructions: "Adults: 1 tablet before breakfast for 2-8 weeks as directed",
    storageConditions: "Store below 30°C in a dry place, protect from light",
    category: "Gastrointestinal Agent"
  },
  {
    id: "med19",
    name: "Augmentin",
    genericName: "Amoxicillin + Clavulanic Acid",
    classification: "Antibiotic",
    prescriptionRequired: true,
    description: "Used to treat bacterial infections",
    imageUrl: null,
    manufacturer: "GSK",
    dosageForm: "Tablet",
    strength: "500mg + 125mg, 875mg + 125mg",
    sideEffects: "Diarrhea, nausea, vomiting, rash, yeast infections",
    contraindications: "Penicillin allergy, mononucleosis, liver disease",
    usageInstructions: "Adults: 1 tablet every 12 hours with food, complete full course",
    storageConditions: "Store at room temperature away from moisture",
    category: "Broad-spectrum Antibiotic"
  },
  {
    id: "med20",
    name: "Montair",
    genericName: "Montelukast",
    classification: "Leukotriene Receptor Antagonist",
    prescriptionRequired: true,
    description: "Used to prevent and treat asthma symptoms and seasonal allergies",
    imageUrl: null,
    manufacturer: "Cipla",
    dosageForm: "Tablet",
    strength: "4mg, 5mg, 10mg",
    sideEffects: "Headache, upper respiratory infection, fever, behavioral changes",
    contraindications: "Hypersensitivity to montelukast, acute asthma attacks",
    usageInstructions: "Adults: 10mg once daily in the evening",
    storageConditions: "Store at room temperature away from moisture and heat",
    category: "Respiratory Medication"
  },
];

export default function MedicationsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [selectedDosageForm, setSelectedDosageForm] = useState('all');

  // Simulate API data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMedications(ALL_MEDICATIONS);
      setFilteredMedications(ALL_MEDICATIONS);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Extract unique manufacturers and dosage forms
  const manufacturers = ['all', ...new Set(ALL_MEDICATIONS.map(med => med.manufacturer))];
  const dosageForms = ['all', ...new Set(ALL_MEDICATIONS.map(med => med.dosageForm))];

  // Handle search and filtering
  useEffect(() => {
    let result = [...medications];
    
    // Apply search query filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(med => 
        med.name.toLowerCase().includes(lowercasedQuery) || 
        med.genericName.toLowerCase().includes(lowercasedQuery) ||
        med.classification.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply prescription type filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'prescription') {
        result = result.filter(med => med.prescriptionRequired);
      } else if (selectedFilter === 'otc') {
        result = result.filter(med => !med.prescriptionRequired);
      }
    }
    
    // Apply manufacturer filter
    if (selectedManufacturer !== 'all') {
      result = result.filter(med => med.manufacturer === selectedManufacturer);
    }
    
    // Apply dosage form filter
    if (selectedDosageForm !== 'all') {
      result = result.filter(med => med.dosageForm === selectedDosageForm);
    }
    
    setFilteredMedications(result);
  }, [searchQuery, medications, selectedFilter, selectedManufacturer, selectedDosageForm]);

  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.medicationCard} 
      onPress={() => router.push(`/medication-details?id=${item.id}`)}
    >
      <View style={styles.medicationImageContainer}>
        <Ionicons name="medkit" size={40} color={COLORS.primary} />
      </View>
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.name}</Text>
        <Text style={styles.medicationGeneric}>{item.genericName}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.classificationContainer}>
            <Text style={styles.classificationText}>{item.classification}</Text>
          </View>
          <View style={styles.manufacturerContainer}>
            <Text style={styles.manufacturerText}>{item.manufacturer}</Text>
          </View>
        </View>
        <Text style={styles.medicationDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );

  const renderPrescriptionFilters = () => (
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
        style={[styles.filterButton, selectedFilter === 'prescription' && styles.filterActive]}
        onPress={() => setSelectedFilter('prescription')}
      >
        <Text style={[styles.filterText, selectedFilter === 'prescription' && styles.filterTextActive]}>
          Prescription
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, selectedFilter === 'otc' && styles.filterActive]}
        onPress={() => setSelectedFilter('otc')}
      >
        <Text style={[styles.filterText, selectedFilter === 'otc' && styles.filterTextActive]}>
          Over the Counter
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderManufacturerFilters = () => (
    <View style={styles.horizontalScrollContainer}>
      <FlatList
        horizontal
        data={manufacturers}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalFiltersList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.filterButton, selectedManufacturer === item && styles.filterActive]}
            onPress={() => setSelectedManufacturer(item)}
          >
            <Text style={[styles.filterText, selectedManufacturer === item && styles.filterTextActive]}>
              {item === 'all' ? 'All Manufacturers' : item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderDosageFormFilters = () => (
    <View style={styles.horizontalScrollContainer}>
      <FlatList
        horizontal
        data={dosageForms}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalFiltersList}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.filterButton, selectedDosageForm === item && styles.filterActive]}
            onPress={() => setSelectedDosageForm(item)}
          >
            <Text style={[styles.filterText, selectedDosageForm === item && styles.filterTextActive]}>
              {item === 'all' ? 'All Dosage Forms' : item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical" size={60} color={COLORS.textLight} />
      <Text style={styles.emptyText}>No medications found</Text>
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
        <Text style={styles.headerTitle}>Medications</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
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
        <Text style={styles.filterSectionTitle}>Prescription Type</Text>
        {renderPrescriptionFilters()}
        
        <Text style={styles.filterSectionTitle}>Manufacturer</Text>
        {renderManufacturerFilters()}
        
        <Text style={styles.filterSectionTitle}>Dosage Form</Text>
        {renderDosageFormFilters()}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedications}
          renderItem={renderMedicationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderListEmptyComponent}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    height: 48,
    backgroundColor: COLORS.lightGrey + '50',
    borderRadius: SIZES.radiusMedium,
  },
  searchIcon: {
    marginRight: SIZES.base,
  },
  searchInput: {
    flex: 1,
    ...FONTS.textMedium,
    color: COLORS.text,
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
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    marginRight: SIZES.base,
    borderRadius: SIZES.radiusSmall,
    backgroundColor: COLORS.lightGrey + '50',
  },
  filterActive: {
    backgroundColor: COLORS.primary + '20',
  },
  filterText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  filterTextActive: {
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
    paddingTop: 0,
  },
  medicationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medicationImageContainer: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radiusSmall,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  medicationGeneric: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginBottom: SIZES.base / 2,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  classificationContainer: {
    backgroundColor: COLORS.primary + '10',
    alignSelf: 'flex-start',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    marginBottom: SIZES.base / 2,
    marginRight: SIZES.base,
  },
  classificationText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  manufacturerContainer: {
    backgroundColor: COLORS.secondary + '10',
    alignSelf: 'flex-start',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    marginBottom: SIZES.base / 2,
  },
  manufacturerText: {
    ...FONTS.textSmall,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  medicationDescription: {
    ...FONTS.textSmall,
    color: COLORS.text,
    marginTop: SIZES.base / 2,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: SIZES.base,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
  },
  emptySubtext: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
}); 