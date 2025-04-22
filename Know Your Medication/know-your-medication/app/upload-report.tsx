import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import apiClient from './utils/apiClient';
import { API_URL } from './utils/config';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function UploadReportScreen() {
  const { patientId, patientName } = useLocalSearchParams();
  const { user, token } = useContext(AuthContext) || {};
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(patientId || '');
  const [selectedPatientName, setSelectedPatientName] = useState(patientName || 'Select a patient');
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('blood');
  const [reportTypeName, setReportTypeName] = useState('Blood Test');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(!patientId);
  const [uploading, setUploading] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);

  // Report types
  const reportTypes = [
    { label: 'Blood Test', value: 'blood' },
    { label: 'Urine Test', value: 'urine' },
    { label: 'X-Ray', value: 'xray' },
    { label: 'CT Scan', value: 'ct' },
    { label: 'MRI', value: 'mri' },
    { label: 'Ultrasound', value: 'ultrasound' },
    { label: 'Other', value: 'other' }
  ];

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

  // Fetch patients based on user role
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        let endpoint = user?.role === 'admin' 
          ? '/api/users/patients'
          : '/api/users/my-patients';
          
        const response = await apiClient.get(endpoint);
        
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
  }, [user?.role]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient._id);
    setSelectedPatientName(patient.name);
    setShowPatientModal(false);
  };

  const handleSelectReportType = (type) => {
    setReportType(type.value);
    setReportTypeName(type.label);
    setShowReportTypeModal(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const pickedFile = result.assets[0];
      
      // Check file size differently on different platforms
      // On Android, we'll use a simplified approach since getInfoAsync may not be available
      let isFileTooLarge = false;
      
      if (Platform.OS === 'ios') {
        try {
      const fileInfo = await FileSystem.getInfoAsync(pickedFile.uri);
          isFileTooLarge = fileInfo.size > 5 * 1024 * 1024;
        } catch (error) {
          console.warn('Error checking file size on iOS:', error);
          // Fallback to using the size from the DocumentPicker result
          isFileTooLarge = pickedFile.size > 5 * 1024 * 1024;
        }
      } else {
        // On Android, use the size property provided by DocumentPicker
        isFileTooLarge = pickedFile.size > 5 * 1024 * 1024;
      }
      
      if (isFileTooLarge) {
        Alert.alert('File Too Large', 'Please select a file smaller than 5MB');
        return;
      }
      
      setSelectedFile(pickedFile);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const validateForm = () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient');
      return false;
    }
    
    if (!reportTitle) {
      Alert.alert('Error', 'Please enter a report title');
      return false;
    }
    
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;
    
    try {
      setUploading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('patientId', selectedPatient);
      formData.append('title', reportTitle);
      formData.append('reportType', reportType);
      
      // Properly handle file upload with correct typings
      if (selectedFile) {
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
        } as any); // Use 'as any' to avoid TypeScript issues with FormData
      }
      
      // Add the uploader information (we don't need to add this manually since the backend takes it from the auth token)
      // The backend already knows who's uploading from the token, so we don't need to explicitly send doctorId
      
      console.log('Submitting to API:', {
        endpoint: '/api/reports',
        patientId: selectedPatient,
        title: reportTitle,
        reportType
      });
      
      const response = await apiClient.post('/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // Increase timeout for file uploads
      });
      
      setUploading(false);
      
      if (response.status === 201) {
        Alert.alert(
          'Success',
          'Report uploaded successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      setUploading(false);
      console.error('Error uploading report:', error);
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || 'Unknown server error';
        
        console.log('Server responded with:', {
          status: statusCode,
          data: error.response.data
        });
        
        if (statusCode === 401) {
          Alert.alert('Authentication Error', 'Please log in again to continue.');
        } else if (statusCode === 403) {
          Alert.alert('Authorization Error', 
            `You don't have permission to upload reports. Role: ${error.response.data?.userRole || 'unknown'}`);
        } else if (statusCode === 413) {
          Alert.alert('File Too Large', 'The selected file exceeds the 5MB size limit.');
        } else {
          Alert.alert('Error', `Failed to upload report: ${errorMessage}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received:', error.request);
        Alert.alert('Network Error', 'No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request
        console.log('Request setup error:', error.message);
      Alert.alert('Error', 'Failed to upload report. Please try again.');
      }
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
        <Text style={styles.headerTitle}>Upload Lab Report</Text>
        <View style={styles.emptyBox} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Upload Patient Lab Report</Text>
          
          {/* Patient Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Select Patient:</Text>
            {patients.length > 0 ? (
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowPatientModal(true)}
              >
                <Text style={styles.pickerButtonText}>{selectedPatientName}</Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            ) : (
              <View style={styles.noPatients}>
                <Text style={styles.noPatientsText}>No patients found</Text>
              </View>
            )}
          </View>
          
          {/* Report Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Report Title:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter report title"
              value={reportTitle}
              onChangeText={setReportTitle}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          
          {/* Report Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Report Type:</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowReportTypeModal(true)}
            >
              <Text style={styles.pickerButtonText}>{reportTypeName}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          
          {/* File Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Upload File:</Text>
            <TouchableOpacity 
              style={styles.filePickerButton}
              onPress={pickDocument}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
              <Text style={styles.filePickerText}>
                {selectedFile ? 'Change Selected File' : 'Select PDF or Image File'}
              </Text>
            </TouchableOpacity>
            
            {selectedFile && (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileDetails}>
                  <Ionicons 
                    name={selectedFile.mimeType.includes('pdf') ? "document-outline" : "image-outline"} 
                    size={24} 
                    color={COLORS.accent} 
                  />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeFileButton}
                    onPress={() => setSelectedFile(null)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
                
                {selectedFile.mimeType.includes('image') && (
                  <Image 
                    source={{ uri: selectedFile.uri }} 
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}
          </View>
          
          {/* Upload Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Upload Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
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
                    styles.pickerItem, 
                    selectedPatient === item._id && styles.selectedPickerItem
                  ]}
                  onPress={() => handleSelectPatient(item)}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  {item._id === selectedPatient && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>
      
      {/* Report Type Modal */}
      <Modal
        visible={showReportTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Report Type</Text>
              <TouchableOpacity onPress={() => setShowReportTypeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={reportTypes}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.pickerItem, 
                    reportType === item.value && styles.selectedPickerItem
                  ]}
                  onPress={() => handleSelectReportType(item)}
                >
                  <Text style={styles.pickerItemText}>{item.label}</Text>
                  {item.value === reportType && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.pickerList}
            />
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
    marginBottom: SIZES.padding * 1.5,
  },
  formLabel: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  pickerButton: {
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
  pickerButtonText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  noPatients: {
    padding: SIZES.padding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
  },
  noPatientsText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
    backgroundColor: COLORS.primaryLight,
  },
  filePickerText: {
    ...FONTS.textMedium,
    color: COLORS.primary,
    marginLeft: SIZES.base,
  },
  selectedFileContainer: {
    marginTop: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: SIZES.base,
  },
  fileName: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  fileSize: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  removeFileButton: {
    padding: SIZES.base,
  },
  imagePreview: {
    height: 200,
    marginTop: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radiusMedium,
    marginTop: SIZES.padding,
  },
  submitButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SIZES.base,
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
  pickerList: {
    padding: SIZES.padding,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  selectedPickerItem: {
    backgroundColor: COLORS.primary + '10',
  },
  pickerItemText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
}); 