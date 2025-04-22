import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import apiClient from './utils/apiClient';

export default function PatientsScreen() {
  const { user, token } = useContext(AuthContext) || {};
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Modal state for add patient
  const [modalVisible, setModalVisible] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  
  // State for all available patients
  const [allPatients, setAllPatients] = useState([]);
  const [filteredAllPatients, setFilteredAllPatients] = useState([]);
  const [loadingAllPatients, setLoadingAllPatients] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSearchFocused, setModalSearchFocused] = useState(false);

  // Check if doctor is approved
  useEffect(() => {
    if (user?.role === 'doctor' && !user.isApproved) {
      Alert.alert(
        'Approval Required',
        'This feature requires administrator approval of your doctor account before use.',
        [{ text: 'OK', onPress: () => router.replace('/home') }]
      );
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users/my-patients');
      
      setPatients(response.data);
      setFilteredPatients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load patients. Please try again.');
      setLoading(false);
    }
  };

  // Fetch all available patients
  const fetchAllPatients = async () => {
    try {
      setLoadingAllPatients(true);
      const response = await apiClient.get('/api/users/patients');
      
      // Filter out patients already in the doctor's list
      const myPatientIds = patients.map(p => p._id);
      const availablePatients = response.data.filter(p => !myPatientIds.includes(p._id));
      
      setAllPatients(availablePatients);
      setFilteredAllPatients(availablePatients);
      setLoadingAllPatients(false);
    } catch (error) {
      console.error('Error fetching all patients:', error);
      Alert.alert('Error', 'Failed to load available patients. Please try again.');
      setLoadingAllPatients(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = patients.filter(
        patient => patient.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

  const handleModalSearch = (text) => {
    setModalSearchQuery(text);
    if (text) {
      const filtered = allPatients.filter(
        patient => patient.name.toLowerCase().includes(text.toLowerCase()) || 
                  patient.email.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredAllPatients(filtered);
    } else {
      setFilteredAllPatients(allPatients);
    }
  };

  const handleModalOpen = () => {
    setModalVisible(true);
    setModalSearchQuery('');
    fetchAllPatients();
  };

  const addPatient = async (patientId) => {
    try {
      setAddingPatient(true);
      
      const response = await apiClient.post('/api/users/add-patient', { patientId });
      
      setAddingPatient(false);
      setModalVisible(false);
      
      Alert.alert('Success', 'Patient added successfully');
      // Refresh patients list
      fetchPatients();
      
    } catch (error) {
      setAddingPatient(false);
      console.error('Error adding patient:', error);
      
      let errorMessage = 'Failed to add patient. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const removePatient = async (patientId) => {
    Alert.alert(
      'Remove Patient',
      'Are you sure you want to remove this patient?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/users/remove-patient/${patientId}`);
              
              Alert.alert('Success', 'Patient removed successfully');
              // Refresh the patients list
              fetchPatients();
            } catch (error) {
              console.error('Error removing patient:', error);
              Alert.alert('Error', 'Failed to remove patient. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderPatientItem = ({ item }) => (
    <View style={styles.patientCard}>
      <TouchableOpacity 
        style={styles.patientInfo}
        onPress={() => {
          console.log('Navigating to patient details:', item._id);
          router.push({
          pathname: '/patient-details',
          params: { patientId: item._id }
          });
        }}
      >
        <View style={styles.patientAvatar}>
          <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
        </View>
        <View style={styles.patientData}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientEmail}>{item.email}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.patientActions}>
        <TouchableOpacity 
          style={styles.labReportsButton}
          onPress={() => router.push({
            pathname: '/patient-reports',
            params: { patientId: item._id, patientName: item.name }
          })}
        >
          <Ionicons name="flask-outline" size={20} color={COLORS.accent} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removePatient(item._id)}
        >
          <Ionicons name="close-circle" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAvailablePatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.availablePatientItem}
      onPress={() => addPatient(item._id)}
      disabled={addingPatient}
    >
      <View style={styles.availablePatientInfo}>
        <View style={[styles.avatarContainer, { width: 40, height: 40 }]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.availablePatientDetails}>
          <Text style={styles.availablePatientName}>{item.name}</Text>
          <Text style={styles.availablePatientEmail}>{item.email}</Text>
        </View>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color={COLORS.lightGrey} />
      <Text style={styles.emptyTitle}>No Patients Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 
          'No patients match your search criteria.' : 
          'You haven\'t added any patients yet. Add patients to manage their prescriptions and lab reports.'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.addPatientButton}
          onPress={handleModalOpen}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.addPatientText}>Add Patient</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyModalList = () => (
    <View style={styles.emptyModalContainer}>
      <Ionicons name="search-outline" size={60} color={COLORS.lightGrey} />
      <Text style={styles.emptyModalTitle}>
        {modalSearchQuery ? 'No patients match your search' : 'No available patients found'}
      </Text>
      <Text style={styles.emptyModalText}>
        {modalSearchQuery ? 
          'Try a different search term' : 
          'There are no new patients available to add to your list'}
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
        <Text style={styles.headerTitle}>My Patients</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleModalOpen}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={searchFocused ? COLORS.primary : COLORS.grey} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name"
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
      
      {/* Add Patient Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Patient</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Select a patient from the list below to add to your patients.
            </Text>
            
            <View style={styles.modalSearchContainer}>
              <Ionicons 
                name="search-outline" 
                size={20} 
                color={modalSearchFocused ? COLORS.primary : COLORS.grey} 
              />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search patients by name or email"
                placeholderTextColor={COLORS.textLight}
                value={modalSearchQuery}
                onChangeText={handleModalSearch}
                onFocus={() => setModalSearchFocused(true)}
                onBlur={() => setModalSearchFocused(false)}
              />
              {modalSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleModalSearch('')}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.grey} />
                </TouchableOpacity>
              )}
            </View>
            
            {loadingAllPatients ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.modalLoadingText}>Loading available patients...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredAllPatients}
                renderItem={renderAvailablePatientItem}
                keyExtractor={(item) => item._id.toString()}
                contentContainerStyle={styles.modalListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyModalList}
                style={styles.modalList}
              />
            )}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: SIZES.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  searchInput: {
    flex: 1,
    ...FONTS.textMedium,
    color: COLORS.text,
    paddingVertical: SIZES.padding,
    marginLeft: SIZES.base,
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 5,
  },
  patientCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientInfo: {
    flexDirection: 'row',
    padding: SIZES.padding,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  avatarText: {
    ...FONTS.titleMedium,
    color: COLORS.white,
  },
  patientData: {
    flex: 1,
  },
  patientName: {
    ...FONTS.textLarge,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  patientEmail: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  patientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labReportsButton: {
    padding: SIZES.base,
    marginRight: SIZES.base,
  },
  removeButton: {
    padding: SIZES.base,
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 3,
  },
  emptyTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  emptyText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  addPatientButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
  },
  addPatientText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    marginLeft: SIZES.base / 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.padding,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  modalTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  modalDescription: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginBottom: SIZES.padding,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    marginBottom: SIZES.padding,
  },
  modalSearchInput: {
    flex: 1,
    ...FONTS.textMedium,
    color: COLORS.text,
    paddingVertical: SIZES.padding,
    marginLeft: SIZES.base,
  },
  modalList: {
    flex: 1,
    marginBottom: SIZES.padding,
  },
  modalListContent: {
    paddingVertical: SIZES.base,
  },
  availablePatientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  availablePatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availablePatientDetails: {
    flex: 1,
    marginLeft: SIZES.padding,
  },
  availablePatientName: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  availablePatientEmail: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
  },
  emptyModalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  emptyModalTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  emptyModalText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: COLORS.lightGrey,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
}); 