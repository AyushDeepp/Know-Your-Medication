import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';
import { API_URL } from './utils/config';

export default function CreatePrescriptionScreen() {
  const { user, token } = useContext(AuthContext) || {};
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  // Prescription form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('Select a patient');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState([
    { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  
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
  
  // Fetch doctor's patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/users/my-patients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data && response.data.length > 0) {
          setPatients(response.data);
          setSelectedPatient(response.data[0]._id);
          setSelectedPatientName(response.data[0].name);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patients:', error);
        Alert.alert('Error', 'Failed to load patients. Please try again.');
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [token]);
  
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient._id);
    setSelectedPatientName(patient.name);
    setShowPatientModal(false);
  };
  
  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };
  
  const handleRemoveMedication = (index) => {
    if (medications.length === 1) {
      Alert.alert('Cannot Remove', 'Prescription must have at least one medication');
      return;
    }
    
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    setMedications(updatedMedications);
  };
  
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
  };
  
  const validateForm = () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient');
      return false;
    }
    
    for (const med of medications) {
      if (!med.medicationName || !med.dosage || !med.frequency) {
        Alert.alert('Error', 'Each medication must have a name, dosage, and frequency');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const prescriptionData = {
        patientId: selectedPatient,
        symptoms,
        medications,
        notes
      };
      
      const response = await axios.post(`${API_URL}/api/prescriptions`, prescriptionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSubmitting(false);
      
      if (response.status === 201) {
        Alert.alert(
          'Success',
          'Prescription created successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      setSubmitting(false);
      console.error('Error creating prescription:', error);
      Alert.alert('Error', 'Failed to create prescription. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
        <Text style={styles.headerTitle}>Create Prescription</Text>
        <View style={styles.emptyBox} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Patient Prescription</Text>
          
          {/* Patient Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Select Patient:</Text>
            {patients.length > 0 ? (
              <TouchableOpacity 
                style={styles.patientSelector}
                onPress={() => setShowPatientModal(true)}
              >
                <Text style={styles.patientSelectorText}>{selectedPatientName}</Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            ) : (
              <View style={styles.noPatients}>
                <Text style={styles.noPatientsText}>No patients found</Text>
                <TouchableOpacity
                  style={styles.addPatientButton}
                  onPress={() => router.push('/patients')}
                >
                  <Text style={styles.addPatientButtonText}>Add Patients</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Patient Selection Modal */}
          <Modal
            visible={showPatientModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPatientModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Patient</Text>
                  <TouchableOpacity onPress={() => setShowPatientModal(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={patients}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.patientItem, 
                        selectedPatient === item._id && styles.selectedPatientItem
                      ]}
                      onPress={() => handleSelectPatient(item)}
                    >
                      <Text style={styles.patientName}>{item.name}</Text>
                      {item._id === selectedPatient && (
                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.patientList}
                />
              </View>
            </View>
          </Modal>
          
          {/* Prescription Details */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Doctor's Information</Text>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Doctor's Name:</Text>
              <Text style={styles.formValue}>{user?.name || 'Doctor'}</Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Date:</Text>
              <Text style={styles.formValue}>{new Date().toLocaleString()}</Text>
            </View>
          </View>
          
          {/* Symptoms */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter patient symptoms"
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          
          {/* Medications */}
          <View style={styles.formSection}>
            <View style={styles.medicationHeader}>
              <Text style={styles.sectionTitle}>Medications</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddMedication}
              >
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.medicationTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Medicine Name</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Dosage</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Frequency</Text>
                <Text style={[styles.tableHeaderCell, { width: 40 }]}></Text>
              </View>
              
              {medications.map((med, index) => (
                <View key={index} style={styles.medicationRow}>
                  {/* Medication Name */}
                  <View style={[styles.medicationCell, { flex: 2 }]}>
                    <TextInput
                      style={styles.medicationInput}
                      placeholder="Medication name"
                      value={med.medicationName}
                      onChangeText={(value) => handleMedicationChange(index, 'medicationName', value)}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                  
                  {/* Dosage */}
                  <View style={[styles.medicationCell, { flex: 1 }]}>
                    <TextInput
                      style={styles.medicationInput}
                      placeholder="Dosage"
                      value={med.dosage}
                      onChangeText={(value) => handleMedicationChange(index, 'dosage', value)}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                  
                  {/* Frequency */}
                  <View style={[styles.medicationCell, { flex: 1 }]}>
                    <TextInput
                      style={styles.medicationInput}
                      placeholder="Frequency"
                      value={med.frequency}
                      onChangeText={(value) => handleMedicationChange(index, 'frequency', value)}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                  
                  {/* Remove Button */}
                  <TouchableOpacity 
                    style={[styles.medicationCell, { width: 40 }]}
                    onPress={() => handleRemoveMedication(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            {/* Additional Fields for Each Medication */}
            {medications.map((med, index) => (
              <View key={`details-${index}`} style={styles.medicationDetails}>
                <Text style={styles.medicationDetailTitle}>
                  Additional Details for {med.medicationName || `Medication ${index + 1}`}
                </Text>
                
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Duration:</Text>
                  <TextInput
                    style={styles.detailInput}
                    placeholder="e.g., 7 days, 2 weeks"
                    value={med.duration}
                    onChangeText={(value) => handleMedicationChange(index, 'duration', value)}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Instructions:</Text>
                  <TextInput
                    style={styles.detailInput}
                    placeholder="e.g., Take with food"
                    value={med.instructions}
                    onChangeText={(value) => handleMedicationChange(index, 'instructions', value)}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>
            ))}
          </View>
          
          {/* Doctor's Notes */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter additional notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          
          {/* Doctor's Signature */}
          <View style={styles.formSection}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Doctor's Signature:</Text>
              <Text style={styles.signatureText}>{user?.name || 'Doctor'}</Text>
            </View>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Create Prescription</Text>
            )}
          </TouchableOpacity>
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
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 4,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.padding,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  formGroup: {
    marginBottom: SIZES.padding,
  },
  formSection: {
    marginBottom: SIZES.padding * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    paddingBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  formLabel: {
    ...FONTS.textMedium,
    color: COLORS.text,
    flex: 1,
  },
  formValue: {
    ...FONTS.textMedium,
    color: COLORS.text,
    flex: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.base,
  },
  noPatients: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  noPatientsText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginBottom: SIZES.base,
  },
  addPatientButton: {
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
  },
  addPatientButtonText: {
    ...FONTS.textSmall,
    color: COLORS.white,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
    ...FONTS.textMedium,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    marginLeft: SIZES.base / 2,
  },
  medicationTable: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGrey,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.base / 2,
  },
  tableHeaderCell: {
    ...FONTS.textSmall,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SIZES.base / 2,
  },
  medicationRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
  medicationCell: {
    padding: SIZES.base / 2,
  },
  medicationInput: {
    ...FONTS.textSmall,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    paddingVertical: SIZES.base / 2,
  },
  medicationDetails: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSmall,
  },
  medicationDetailTitle: {
    ...FONTS.textSmall,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: SIZES.base,
  },
  detailInput: {
    flex: 2,
    ...FONTS.textSmall,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    paddingVertical: SIZES.base / 2,
  },
  signatureText: {
    ...FONTS.textMedium,
    color: COLORS.primary,
    fontStyle: 'italic',
    flex: 2,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  submitButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
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
  picker: {
    width: '100%',
    color: COLORS.text,
  },
  patientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    marginTop: SIZES.base,
  },
  patientSelectorText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusMedium,
    borderTopRightRadius: SIZES.radiusMedium,
    paddingBottom: SIZES.padding * 2,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  modalTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
  },
  patientList: {
    padding: SIZES.padding,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  selectedPatientItem: {
    backgroundColor: COLORS.primary + '10',
  },
  patientName: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
}); 