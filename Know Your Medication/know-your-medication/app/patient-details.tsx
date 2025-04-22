import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Image,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';
import { API_URL } from './utils/config';
import ProfilePicture from './components/ProfilePicture';

export default function PatientDetailsScreen() {
  const { token } = useContext(AuthContext) || {};
  const { patientId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (token && patientId) {
    fetchPatientData();
    }
  }, [patientId, token]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      console.log('Fetching patient details for ID:', patientId);
      
      const patientResponse = await axios.get(`${API_URL}/api/users/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Patient data received:', patientResponse.data ? 'Yes' : 'No');
      setPatient(patientResponse.data);
      
      try {
        // Fetch patient's prescriptions - try multiple endpoints
        console.log('Trying to fetch prescriptions for patient:', patientId);
        let prescriptionsResponse;
        
        try {
          // First try with admin endpoint (for admins)
          console.log('Trying admin endpoint for prescriptions');
          prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/admin/patient/${patientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log('Admin endpoint successful for prescriptions');
        } catch (e) {
          try {
            // Then try with doctor/admin endpoint
            console.log('Admin endpoint failed, trying doctor endpoint');
            prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/patient/${patientId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log('Doctor endpoint successful for prescriptions');
          } catch (e2) {
            // Finally try with patient endpoint
            console.log('Doctor endpoint failed, trying patient endpoint');
            prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/my-prescriptions/${patientId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log('Patient endpoint successful for prescriptions');
          }
        }
        
        console.log('Prescriptions count:', prescriptionsResponse.data.length);
        setPrescriptions(prescriptionsResponse.data);
      } catch (prescError: any) {
        console.error('Error fetching prescriptions:', prescError.response?.data || prescError.message);
        console.error('Error details:', prescError);
        // Don't show an alert, just log the error and continue
        setPrescriptions([]);
      }
      
      try {
        // Fetch patient's lab reports - try multiple endpoints
        console.log('Trying to fetch lab reports for patient:', patientId);
        let reportsResponse;
        
        try {
          // First try admin endpoint
          reportsResponse = await axios.get(`${API_URL}/api/reports/admin/patient/${patientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log('Admin endpoint successful for reports');
        } catch (e) {
          // Then try regular endpoint
          reportsResponse = await axios.get(`${API_URL}/api/reports/patient/${patientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log('Regular endpoint successful for reports');
        }
        
        console.log('Reports count:', reportsResponse.data.length);
        setReports(reportsResponse.data);
      } catch (reportError: any) {
        console.error('Error fetching reports:', reportError.response?.data || reportError.message);
        // Don't show an alert, just log the error and continue
        setReports([]);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching patient data:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load patient data. Please try again.');
      setLoading(false);
    }
  };

  const renderPrescriptionItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: '/prescription-details',
        params: { prescriptionId: item._id }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>
            {item.diagnosis ? (item.diagnosis.length > 25 ? item.diagnosis.substring(0, 25) + '...' : item.diagnosis) : 'Prescription'}
          </Text>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
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
      
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>Medications:</Text>
        {item.medications.slice(0, 2).map((med: any, index: number) => (
          <Text key={index} style={styles.medicationItem}>
            • {med.medicationName} - {med.dosage} {med.frequency}
          </Text>
        ))}
        {item.medications.length > 2 && (
          <Text style={styles.moreItems}>+{item.medications.length - 2} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderReportItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: '/report-details' as any,
        params: { reportId: item._id }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons 
            name={item.reportType === 'blood' ? 'water-outline' : 
                  item.reportType === 'xray' ? 'scan-outline' : 
                  item.reportType === 'mri' ? 'magnet-outline' : 'flask-outline'} 
            size={24} 
            color={COLORS.accent} 
          />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Doctor info */}
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
      
      {/* Patient info (if we're not already in a patient view) */}
      {(!patientId || patientId !== item.patientId?._id) && item.patientId && (
        <View style={styles.patientInfo}>
          <Ionicons name="person-outline" size={16} color={COLORS.accent} />
          <Text style={styles.patientName}>
            Patient: {item.patientId.name || 'Unknown Patient'}
          </Text>
        </View>
      )}
      
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>Report Type:</Text>
        <Text style={styles.reportType}>
          {item.reportType === 'blood' ? 'Blood Test' : 
           item.reportType === 'urine' ? 'Urine Test' : 
           item.reportType === 'xray' ? 'X-Ray' : 
           item.reportType === 'ct' ? 'CT Scan' : 
           item.reportType === 'mri' ? 'MRI' : 
           item.reportType === 'ultrasound' ? 'Ultrasound' : 'Other'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = (type) => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={type === 'prescriptions' ? 'document-text-outline' : 'flask-outline'} 
        size={60} 
        color={COLORS.lightGrey} 
      />
      <Text style={styles.emptyTitle}>
        No {type === 'prescriptions' ? 'Prescriptions' : 'Lab Reports'} Found
      </Text>
      <Text style={styles.emptyText}>
        This patient doesn't have any {type === 'prescriptions' ? 'prescriptions' : 'lab reports'} yet.
      </Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push(type === 'prescriptions' ? '/create-prescription' : '/upload-report', {
          params: { patientId }
        })}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.addButtonText}>
          {type === 'prescriptions' ? 'Create Prescription' : 'Upload Report'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
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
          <Text style={styles.headerTitle}>Patient Details</Text>
          <View style={styles.emptyBox} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading patient data...</Text>
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
        <Text style={styles.headerTitle}>Patient Details</Text>
        <View style={styles.emptyBox} />
      </View>
      
      {patient && (
        <View style={styles.patientInfo}>
          <ProfilePicture 
            uri={patient.profilePicture}
            name={patient.name}
            role="patient"
            size={80}
          />
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.contactText}>{patient.email}</Text>
            </View>
            {patient.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color={COLORS.textLight} />
                <Text style={styles.contactText}>{patient.phone}</Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={activeTab === 'info' ? COLORS.primary : COLORS.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            Info
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'prescriptions' && styles.activeTab]}
          onPress={() => setActiveTab('prescriptions')}
        >
          <Ionicons 
            name="document-text-outline" 
            size={20} 
            color={activeTab === 'prescriptions' ? COLORS.primary : COLORS.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.activeTabText]}>
            Prescriptions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Ionicons 
            name="flask-outline" 
            size={20} 
            color={activeTab === 'reports' ? COLORS.primary : COLORS.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Lab Reports
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'info' && (
        <ScrollView style={styles.contentContainer}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name:</Text>
              <Text style={styles.infoValue}>{patient?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{patient?.email}</Text>
            </View>
            {patient?.profile?.phoneNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{patient.profile.phoneNumber}</Text>
              </View>
            )}
            {patient?.profile?.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{patient.profile.address}</Text>
              </View>
            )}
            {patient?.profile?.gender && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoValue}>{patient.profile.gender}</Text>
              </View>
            )}
            {patient?.profile?.age && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{patient.profile.age}</Text>
              </View>
            )}
          </View>
          
          {/* Medical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group:</Text>
              <Text style={styles.infoValue}>{patient?.profile?.bloodGroup || 'Not specified'}</Text>
            </View>
            
            {/* Allergies Section */}
            <Text style={styles.subSectionTitle}>Allergies</Text>
            {patient?.profile?.allergies && patient.profile.allergies.length > 0 ? (
              patient.profile.allergies.map((allergy, index) => (
                <View key={index} style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Text style={styles.infoCardTitle}>{allergy.name}</Text>
                    <View style={[
                      styles.severityBadge, 
                      allergy.severity === 'Mild' ? styles.mildBadge : 
                      allergy.severity === 'Severe' ? styles.severeBadge : 
                      styles.moderateBadge
                    ]}>
                      <Text style={styles.severityText}>{allergy.severity}</Text>
                    </View>
                  </View>
                  {allergy.notes && (
                    <Text style={styles.infoCardNotes}>{allergy.notes}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyInfoText}>No allergies recorded</Text>
            )}
            
            {/* Medical Conditions Section */}
            <Text style={styles.subSectionTitle}>Medical Conditions</Text>
            {patient?.profile?.medicalConditions && patient.profile.medicalConditions.length > 0 ? (
              patient.profile.medicalConditions.map((condition, index) => (
                <View key={index} style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Text style={styles.infoCardTitle}>{condition.condition}</Text>
                    {condition.isCurrent ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    ) : (
                      <View style={styles.pastBadge}>
                        <Text style={styles.pastBadgeText}>Past</Text>
                      </View>
                    )}
                  </View>
                  {condition.diagnosedDate && (
                    <Text style={styles.diagnosedDate}>
                      Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                    </Text>
                  )}
                  {condition.notes && (
                    <Text style={styles.infoCardNotes}>{condition.notes}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyInfoText}>No medical conditions recorded</Text>
            )}
          </View>
          
          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            {patient?.profile?.emergencyContacts && patient.profile.emergencyContacts.length > 0 ? (
              <>
                {/* Find primary contact */}
                {(() => {
                  const primaryContact = patient.profile.emergencyContacts.find(c => c.isPrimary);
                  if (primaryContact) {
                    return (
                      <View style={styles.contactCard}>
                        <View style={styles.contactHeader}>
                          <Ionicons name="alert-circle-outline" size={24} color={COLORS.accent} />
                          <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{primaryContact.name}</Text>
                            <Text style={styles.contactRelationship}>{primaryContact.relationship}</Text>
                          </View>
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryText}>Primary</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.callButton}
                          onPress={() => Alert.alert('Contact', `Call ${primaryContact.name} at ${primaryContact.phoneNumber}?`)}
                        >
                          <Ionicons name="call-outline" size={16} color={COLORS.white} />
                          <Text style={styles.callButtonText}>{primaryContact.phoneNumber}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return null;
                })()}
                
                {/* Other contacts if any */}
                {patient.profile.emergencyContacts.filter(c => !c.isPrimary).length > 0 && (
                  <>
                    <Text style={styles.subSectionTitle}>Other Contacts</Text>
                    {patient.profile.emergencyContacts.filter(c => !c.isPrimary).map((contact, index) => (
                      <View key={index} style={styles.contactCard}>
                        <View style={styles.contactHeader}>
                          <Ionicons name="person-outline" size={24} color={COLORS.primary} />
                          <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{contact.name}</Text>
                            <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.callButton}
                          onPress={() => Alert.alert('Contact', `Call ${contact.name} at ${contact.phoneNumber}?`)}
                        >
                          <Ionicons name="call-outline" size={16} color={COLORS.white} />
                          <Text style={styles.callButtonText}>{contact.phoneNumber}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <Text style={styles.emptyInfoText}>No emergency contacts specified</Text>
            )}
          </View>
        </ScrollView>
      )}
      
      {activeTab === 'prescriptions' && (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescriptionItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => renderEmpty('prescriptions')}
        />
      )}
      
      {activeTab === 'reports' && (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => renderEmpty('reports')}
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
  patientInfo: {
    flexDirection: 'row',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SIZES.padding,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  avatarText: {
    ...FONTS.titleLarge,
    color: COLORS.white,
  },
  patientDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contactText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: SIZES.base / 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginLeft: SIZES.base / 2,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    padding: SIZES.padding,
  },
  section: {
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
  sectionTitle: {
    ...FONTS.textLarge,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.base,
  },
  infoLabel: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    width: '40%',
  },
  infoValue: {
    ...FONTS.textMedium,
    color: COLORS.text,
    flex: 1,
  },
  actionButtons: {
    marginBottom: SIZES.padding * 3,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMedium,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding,
  },
  secondaryButton: {
    backgroundColor: COLORS.accent,
  },
  actionButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SIZES.base,
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 3,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...FONTS.textLarge,
    color: COLORS.text,
    marginLeft: SIZES.base,
  },
  cardDate: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  cardContent: {
    marginTop: SIZES.base,
  },
  cardLabel: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginBottom: SIZES.base / 2,
  },
  medicationItem: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginBottom: 2,
  },
  reportType: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  moreItems: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginTop: SIZES.base / 2,
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
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
  },
  addButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    marginLeft: SIZES.base / 2,
  },
  subSectionTitle: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  infoCardTitle: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  infoCardNotes: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  severityBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
  },
  mildBadge: {
    backgroundColor: COLORS.success + '20',
  },
  moderateBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  severeBadge: {
    backgroundColor: COLORS.error + '20',
  },
  severityText: {
    ...FONTS.textSmall,
    fontWeight: '500',
  },
  currentBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
  },
  currentBadgeText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  pastBadge: {
    backgroundColor: COLORS.grey + '20',
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
  },
  pastBadgeText: {
    ...FONTS.textSmall,
    color: COLORS.grey,
    fontWeight: '500',
  },
  diagnosedDate: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginBottom: SIZES.base,
  },
  emptyInfoText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: SIZES.padding,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  contactInfo: {
    marginLeft: SIZES.base,
    flex: 1,
  },
  contactName: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  contactRelationship: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  primaryBadge: {
    backgroundColor: COLORS.success + '20',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
  },
  primaryText: {
    ...FONTS.textSmall,
    color: COLORS.success,
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.base,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.base,
  },
  callButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    marginLeft: SIZES.base / 2,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  doctorName: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginLeft: SIZES.base,
  },
  specialization: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: SIZES.base,
    fontStyle: 'italic',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  patientName: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginLeft: SIZES.base,
  },
}); 