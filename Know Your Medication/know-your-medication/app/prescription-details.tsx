import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import apiClient from './utils/apiClient';
import Card from './components/Card';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PrescriptionDetailsScreen() {
  const { prescriptionId } = useLocalSearchParams();
  const { token } = useContext(AuthContext) || {};
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    fetchPrescriptionDetails();
  }, [prescriptionId, token]);

  const fetchPrescriptionDetails = async () => {
    if (!prescriptionId) {
      Alert.alert('Error', 'Prescription ID is missing');
      router.back();
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching prescription details for ID:', prescriptionId);
      const response = await apiClient.get(`/api/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prescription details:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      Alert.alert('Error', 'Failed to load prescription details. Please try again.');
      setLoading(false);
      router.back();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generatePrescriptionHTML = () => {
    if (!prescription) return '';
    
    // Generate medications HTML
    const medicationsHTML = prescription.medications.map((med) => `
      <div style="margin-bottom: 15px;">
        <h3 style="color: #333; margin-bottom: 5px;">${med.medicationName}</h3>
        <div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
          <div style="display: flex; margin-bottom: 5px;">
            <span style="color: #666; width: 40%;">Dosage:</span>
            <span>${med.dosage}</span>
          </div>
          <div style="display: flex; margin-bottom: 5px;">
            <span style="color: #666; width: 40%;">Frequency:</span>
            <span>${med.frequency}</span>
          </div>
          <div style="display: flex; margin-bottom: 5px;">
            <span style="color: #666; width: 40%;">Duration:</span>
            <span>${med.duration || 'As needed'}</span>
          </div>
          ${med.instructions ? `
            <div style="display: flex; margin-bottom: 5px;">
              <span style="color: #666; width: 40%;">Instructions:</span>
              <span>${med.instructions}</span>
            </div>` : ''}
        </div>
      </div>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 40px;
              color: #333;
              line-height: 1.5;
            }
            .prescription-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
            }
            .prescription-id {
              color: #777;
              font-size: 14px;
              margin-bottom: 15px;
            }
            h1 {
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              color: #3498db;
              margin-bottom: 10px;
              font-size: 18px;
              font-weight: bold;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .info-label {
              color: #666;
              font-weight: bold;
            }
            .divider {
              height: 1px;
              background-color: #ddd;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="prescription-header">
            <h1>Medical Prescription</h1>
            <div class="prescription-id">ID: ${prescription.prescriptionId}</div>
          </div>
          
          <div class="section">
            <div class="section-title">General Information</div>
            <div class="info-row">
              <span class="info-label">Doctor:</span>
              <span>Dr. ${prescription.doctorId?.name || 'Unknown'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient:</span>
              <span>${prescription.patientId?.name || 'Unknown'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time:</span>
              <span>${formatDateTime(prescription.date || prescription.createdAt)}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="section">
            <div class="section-title">Symptoms</div>
            <p>${prescription.symptoms || 'No specific symptoms provided'}</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="section">
            <div class="section-title">Medications</div>
            ${medicationsHTML}
          </div>
          
          ${prescription.notes ? `
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">Additional Notes</div>
              <p>${prescription.notes}</p>
            </div>` : ''}
          
          <div class="footer">
            This is a digital prescription from Know Your Medication App.
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintPrescription = async () => {
    if (!prescription) return;
    
    try {
      setPrinting(true);
      const html = generatePrescriptionHTML();
      
      if (Platform.OS === 'web') {
        // For web, we can use window.print()
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        // For mobile, use expo-print
        const { uri } = await Print.printToFileAsync({ html });
        
        if (Platform.OS === 'ios') {
          await Print.printAsync({ uri });
        } else {
          // On Android, we can share the PDF
          await Sharing.shareAsync(uri);
        }
      }
      
      setPrinting(false);
    } catch (error) {
      console.error('Error printing prescription:', error);
      Alert.alert('Error', 'Failed to print prescription. Please try again.');
      setPrinting(false);
    }
  };

  const handleSharePrescription = async () => {
    if (!prescription) return;
    
    try {
      const message = `Prescription Details\n\nID: ${prescription.prescriptionId}\nDoctor: Dr. ${prescription.doctorId?.name || 'Unknown'}\nDate: ${formatDateTime(prescription.date || prescription.createdAt)}`;
      await Share.share({
        message,
        title: 'Prescription Details',
      });
    } catch (error) {
      console.error('Error sharing prescription:', error);
      Alert.alert('Error', 'Failed to share prescription. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading prescription details...</Text>
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
        <Text style={styles.headerTitle}>Prescription Details</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSharePrescription}
            disabled={!prescription}
          >
            <Ionicons name="share-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePrintPrescription}
            disabled={printing || !prescription}
          >
            <Ionicons name="print-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {printing && (
        <View style={styles.printingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.printingText}>Preparing to print...</Text>
        </View>
      )}
      
      {prescription ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.prescriptionCard}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>General Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prescription ID:</Text>
                <Text style={styles.infoValue}>
                  {prescription.prescriptionId || 'Not available'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doctor:</Text>
                <Text style={styles.infoValue}>
                  Dr. {prescription.doctorId?.name || 'Unknown'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date & Time:</Text>
                <Text style={styles.infoValue}>{formatDateTime(prescription.date || prescription.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Symptoms</Text>
              <Text style={styles.diagnosisText}>
                {prescription.symptoms || 'No specific symptoms provided'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medications</Text>
              {prescription.medications.map((medication, index) => (
                <View key={index} style={styles.medicationContainer}>
                  <Text style={styles.medicationName}>{medication.medicationName}</Text>
                  
                  <View style={styles.medicationDetails}>
                    <View style={styles.medicationInfoRow}>
                      <Text style={styles.medicationInfoLabel}>Dosage:</Text>
                      <Text style={styles.medicationInfoValue}>{medication.dosage}</Text>
                    </View>
                    
                    <View style={styles.medicationInfoRow}>
                      <Text style={styles.medicationInfoLabel}>Frequency:</Text>
                      <Text style={styles.medicationInfoValue}>{medication.frequency}</Text>
                    </View>
                    
                    <View style={styles.medicationInfoRow}>
                      <Text style={styles.medicationInfoLabel}>Duration:</Text>
                      <Text style={styles.medicationInfoValue}>{medication.duration || 'As needed'}</Text>
                    </View>
                    
                    {medication.instructions && (
                      <View style={styles.medicationInfoRow}>
                        <Text style={styles.medicationInfoLabel}>Special Instructions:</Text>
                        <Text style={styles.medicationInfoValue}>{medication.instructions}</Text>
                      </View>
                    )}
                  </View>
                  
                  {index < prescription.medications.length - 1 && (
                    <View style={styles.medicationDivider} />
                  )}
                </View>
              ))}
            </View>

            {prescription.notes && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Notes</Text>
                  <Text style={styles.notesText}>{prescription.notes}</Text>
                </View>
              </>
            )}
          </Card>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
          <Text style={styles.errorTitle}>Prescription Not Found</Text>
          <Text style={styles.errorMessage}>
            The prescription details could not be loaded. Please try again later.
          </Text>
          <TouchableOpacity 
            style={styles.backToListButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToListText}>Back to My Prescriptions</Text>
          </TouchableOpacity>
        </View>
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
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SIZES.base,
    marginLeft: SIZES.base,
  },
  printingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  printingText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    marginTop: SIZES.padding,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  prescriptionCard: {
    overflow: 'hidden',
  },
  section: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.primary,
    marginBottom: SIZES.padding,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.base,
  },
  infoLabel: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    flex: 1,
  },
  infoValue: {
    ...FONTS.textMedium,
    color: COLORS.text,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
  },
  diagnosisText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  medicationContainer: {
    marginBottom: SIZES.padding,
  },
  medicationName: {
    ...FONTS.textLarge,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  medicationDetails: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  medicationInfoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.base,
  },
  medicationInfoLabel: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    width: '40%',
  },
  medicationInfoValue: {
    ...FONTS.textMedium,
    color: COLORS.text,
    flex: 1,
  },
  medicationDivider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: SIZES.padding,
  },
  notesText: {
    ...FONTS.textMedium,
    color: COLORS.text,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  errorMessage: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  backToListButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  backToListText: {
    ...FONTS.textMedium,
    color: COLORS.white,
  },
}); 