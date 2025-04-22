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
  Switch,
  Image,
  FlatList,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';
import { API_URL } from './utils/config';
import Card from './components/Card';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfilePicture from './components/ProfilePicture';

export default function UserDetailsScreen() {
  const { token } = useContext(AuthContext) || {};
  const { userId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (token && userId) {
      fetchUserData();
    }
  }, [userId, token]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('Fetching user details for ID:', userId);
      
      const userResponse = await axios.get(`${API_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('User data received:', userResponse.data ? 'Yes' : 'No');
      setUser(userResponse.data);

      // If the user is a patient, fetch their prescriptions and reports
      if (userResponse.data.role === 'patient') {
        try {
          console.log('Fetching prescriptions for patient with ID:', userId);
          // Try multiple endpoints to fetch prescriptions
          let prescriptionsResponse;

          try {
            // First try admin endpoint
            console.log('Trying admin endpoint for prescriptions');
            prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/admin/patient/${userId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log('Admin endpoint successful for prescriptions');
          } catch (e) {
            try {
              // Then try doctor endpoint
              console.log('Admin endpoint failed, trying doctor endpoint');
              prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/patient/${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              console.log('Doctor endpoint successful for prescriptions');
            } catch (e2) {
              // Finally try patient endpoint
              console.log('Doctor endpoint failed, trying patient endpoint');
              prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/my-prescriptions/${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              console.log('Patient endpoint successful for prescriptions');
            }
          }
          
          console.log('Prescriptions fetched successfully:', prescriptionsResponse.data.length);
          setPrescriptions(prescriptionsResponse.data);
        } catch (prescError: any) {
          console.error('Error fetching prescriptions:', prescError.response?.data || prescError.message);
          console.error('Error status:', prescError.response?.status);
          console.error('Full error details:', prescError);
          
          // Last resort: Try the general patient endpoint
          try {
            console.log('Trying fallback endpoint for patient prescriptions');
            const prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/patient`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log('Fallback prescriptions fetched successfully:', prescriptionsResponse.data.length);
            setPrescriptions(prescriptionsResponse.data);
          } catch (fallbackError) {
            console.error('All prescription endpoints failed');
            setPrescriptions([]);
          }
        }
        
        try {
          console.log('Fetching reports for patient with ID:', userId);
          // Fetch patient's lab reports
          const reportsResponse = await axios.get(`${API_URL}/api/reports/patient/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          console.log('Reports fetched successfully:', reportsResponse.data.length);
          setReports(reportsResponse.data);
        } catch (reportError: any) {
          console.error('Error fetching reports:', reportError.response?.data || reportError.message);
          console.error('Error status:', reportError.response?.status);
          console.error('Full error details:', reportError);
          
          // Try fallback method for reports
          try {
            console.log('Trying fallback endpoint for patient reports');
            const reportsResponse = await axios.get(`${API_URL}/api/reports/patient`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log('Fallback reports fetched successfully:', reportsResponse.data.length);
            setReports(reportsResponse.data);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setReports([]);
          }
        }
      } 
      // If the user is a doctor, fetch prescriptions and reports created by them
      else if (userResponse.data.role === 'doctor') {
        try {
          console.log('Fetching prescriptions for doctor with ID:', userId);
          // Fetch doctor's prescriptions - use the doctor/:doctorId endpoint when viewed by an admin
          const prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/doctor/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          console.log('Doctor prescriptions fetched successfully:', prescriptionsResponse.data.length);
          setPrescriptions(prescriptionsResponse.data);
        } catch (prescError: any) {
          console.error('Error fetching doctor prescriptions:', prescError.response?.data || prescError.message);
          console.error('Error status:', prescError.response?.status);
          console.error('Full error details:', prescError);
          
          // Try fallback method for doctor prescriptions
          try {
            console.log('Trying fallback endpoint for doctor prescriptions');
            const prescriptionsResponse = await axios.get(`${API_URL}/api/prescriptions/doctor`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log('Fallback doctor prescriptions fetched successfully:', prescriptionsResponse.data.length);
            setPrescriptions(prescriptionsResponse.data);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setPrescriptions([]);
          }
        }
        
        try {
          console.log('Fetching reports for doctor with ID:', userId);
          // Fetch doctor's uploaded reports - use the doctor/:doctorId endpoint for admin
          const reportsResponse = await axios.get(`${API_URL}/api/reports/doctor/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          console.log('Doctor reports fetched successfully:', reportsResponse.data.length);
          setReports(reportsResponse.data);
        } catch (reportError: any) {
          console.error('Error fetching doctor reports:', reportError.response?.data || reportError.message);
          console.error('Error status:', reportError.response?.status);
          console.error('Full error details:', reportError);
          
          // Try fallback method for doctor reports
          try {
            console.log('Trying fallback endpoint for doctor reports');
            const reportsResponse = await axios.get(`${API_URL}/api/reports/doctor`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log('Fallback doctor reports fetched successfully:', reportsResponse.data.length);
            setReports(reportsResponse.data);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setReports([]);
          }
        }
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching user data:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
      setLoading(false);
    }
  };

  const handleApproveDoctor = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/api/users/approve-doctor`,
        { doctorId: userId, isApproved: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      Alert.alert('Success', 'Doctor has been approved');
      // Refresh the user data
      fetchUserData();
    } catch (error) {
      console.error('Error approving doctor:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to approve doctor. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${API_URL}/api/users/${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              Alert.alert('Success', 'User has been deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting user:', error.response?.data || error.message);
              Alert.alert('Error', 'Failed to delete user. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderRoleBadge = () => {
    const roleColors = {
      patient: COLORS.primary,
      doctor: COLORS.success,
      admin: COLORS.accent
    };
    
    return (
      <View style={[styles.roleBadge, { backgroundColor: roleColors[user.role] + '20' }]}>
        <Text style={[styles.roleText, { color: roleColors[user.role] }]}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Text>
      </View>
    );
  };

  const renderStatusBadge = () => {
    if (user.role === 'doctor' && !user.isApproved) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: COLORS.warning + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.warning }]}>
            Pending Approval
          </Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '20' }]}>
        <Text style={[styles.statusText, { color: COLORS.success }]}>
          Active
        </Text>
      </View>
    );
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
            {item.diagnosis || item.symptoms?.slice(0, 25) || 'Prescription'}
          </Text>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        {user?.role === 'doctor' && item.patientId && (
          <>
            <Ionicons name="person-outline" size={16} color={COLORS.accent} />
            <Text style={styles.infoText}>
              Patient: {item.patientId.name || 'Unknown Patient'}
            </Text>
          </>
        )}
        
        {user?.role === 'patient' && item.doctorId && (
          <>
            <Ionicons name="medkit-outline" size={16} color={COLORS.accent} />
            <Text style={styles.infoText}>
              Dr. {item.doctorId.name || 'Unknown Doctor'}
            </Text>
          </>
        )}
        
        {user?.role === 'admin' && (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={COLORS.accent} />
              <Text style={styles.infoText}>
                Patient: {item.patientId?.name || 'Unknown Patient'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="medkit-outline" size={16} color={COLORS.accent} />
              <Text style={styles.infoText}>
                Dr. {item.doctorId?.name || 'Unknown Doctor'}
              </Text>
            </View>
          </>
        )}
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>Medications:</Text>
        {item.medications?.slice(0, 2).map((med: any, index: number) => (
          <Text key={index} style={styles.medicationItem}>
            • {med.medicationName} - {med.dosage} {med.frequency}
          </Text>
        ))}
        {item.medications?.length > 2 && (
          <Text style={styles.moreItems}>+{item.medications.length - 2} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getReportTypeName = (type) => {
    switch (type) {
      case 'blood':
        return 'Blood Test';
      case 'urine':
        return 'Urine Test';
      case 'xray':
        return 'X-Ray';
      case 'ct':
        return 'CT Scan';
      case 'mri':
        return 'MRI';
      case 'ultrasound':
        return 'Ultrasound';
      default:
        return 'Other';
    }
  };

  const viewReport = async (report) => {
    try {
      // Get token for viewing
      const authData = await AsyncStorage.getItem('auth-storage');
      let token = '';
      
      if (authData) {
        const { state } = JSON.parse(authData);
        if (state?.token) {
          token = state.token;
        }
      }
      
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }
      
      console.log('Viewing report:', report._id);
      
      // Open report in browser or PDF viewer
      await WebBrowser.openBrowserAsync(`${API_URL}/api/reports/view/${report._id}?token=${token}`);
    } catch (error) {
      console.error('Error viewing report:', error);
      Alert.alert('Error', 'Could not open the report. Please try again.');
    }
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => viewReport(item)}
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
      
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>Report Type:</Text>
        <Text style={styles.reportType}>
          {getReportTypeName(item.reportType)}
        </Text>
        
        <Text style={styles.cardLabel}>Uploaded by:</Text>
        <Text style={styles.reportDoctor}>
          {item.doctorId && item.doctorId.name ? `Dr. ${item.doctorId.name}` : 'Unknown'}
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
        This {user?.role} doesn't have any {type === 'prescriptions' ? 'prescriptions' : 'lab reports'} yet.
      </Text>
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
          <Text style={styles.headerTitle}>User Details</Text>
          <View style={styles.emptyBox} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading user data...</Text>
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
        <Text style={styles.headerTitle}>User Details</Text>
        <View style={styles.emptyBox} />
      </View>
      
      {user && (
        <View style={styles.userInfo}>
          <ProfilePicture 
            uri={user.profilePicture}
            name={user.name}
            role={user.role}
            size={80}
          />
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.contactText}>{user.email}</Text>
            </View>
            <View style={styles.badgeContainer}>
              {renderRoleBadge()}
              {renderStatusBadge()}
            </View>
          </View>
        </View>
      )}
      
      {/* Tab Navigation */}
      {(user?.role === 'patient' || user?.role === 'doctor') && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Information
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'prescriptions' && styles.activeTab]}
            onPress={() => setActiveTab('prescriptions')}
          >
            <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.activeTabText]}>
              Prescriptions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
              Lab Reports
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {activeTab === 'info' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.value}>{user.userId || 'Not available'}</Text>
            </View>
            
            {user.role === 'patient' && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Patient ID</Text>
                <Text style={styles.value}>{user.patientId || 'Not available'}</Text>
              </View>
            )}
            
            {user.role === 'doctor' && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Doctor ID</Text>
                <Text style={styles.value}>{user.doctorId || 'Not available'}</Text>
              </View>
            )}
            
            {user.role === 'admin' && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Admin ID</Text>
                <Text style={styles.value}>{user.adminId || 'Not available'}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            
            {user.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{user.phone}</Text>
              </View>
            )}
            
            {user.address && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{user.address}</Text>
              </View>
            )}
            
            {user.dateOfBirth && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Date of Birth</Text>
                <Text style={styles.value}>
                  {new Date(user.dateOfBirth).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Role</Text>
              <Text style={styles.value}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
            
            {user.role === 'doctor' && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Approval Status</Text>
                  <Text style={
                    [
                      styles.value, 
                      {color: user.isApproved ? COLORS.success : COLORS.warning}
                    ]
                  }>
                    {user.isApproved ? 'Approved' : 'Pending Approval'}
                  </Text>
                </View>
                {user.profile && user.profile.specialization && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Specialization</Text>
                    <Text style={styles.value}>{user.profile.specialization}</Text>
                  </View>
                )}
                {user.profile && user.profile.hospital && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Hospital</Text>
                    <Text style={styles.value}>{user.profile.hospital}</Text>
                  </View>
                )}
              </>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Account Created</Text>
              <Text style={styles.value}>
                {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card>
          
          {user.role === 'doctor' && !user.isApproved && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <TouchableOpacity 
                style={styles.buttonContainer}
                onPress={handleApproveDoctor}
              >
                <Text style={styles.buttonText}>Approve Doctor</Text>
              </TouchableOpacity>
            </Card>
          )}
          
          <Card style={[styles.card, styles.dangerZone]}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDeleteUser}
            >
              <Text style={styles.deleteButtonText}>Delete User</Text>
            </TouchableOpacity>
          </Card>
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
    flex: 1,
    textAlign: 'center',
  },
  emptyBox: {
    width: 40,
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
  userInfo: {
    flexDirection: 'row',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    backgroundColor: COLORS.white,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '40',
  },
  avatarText: {
    ...FONTS.titleLarge,
    color: COLORS.white,
  },
  userDetails: {
    marginLeft: SIZES.padding,
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
    marginRight: 8,
  },
  roleText: {
    ...FONTS.textSmall,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSmall,
  },
  statusText: {
    ...FONTS.textSmall,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  card: {
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base / 2,
    marginBottom: SIZES.base / 2,
  },
  label: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
  },
  value: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: SIZES.base,
  },
  dangerZone: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  dangerTitle: {
    ...FONTS.titleSmall,
    color: COLORS.error,
    marginBottom: SIZES.base,
  },
  buttonContainer: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  buttonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20',
    padding: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  deleteButtonText: {
    ...FONTS.textMedium,
    color: COLORS.error,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.padding * 0.75,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
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
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  medicationItem: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginBottom: 2,
  },
  moreItems: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    marginTop: 2,
  },
  reportType: {
    ...FONTS.textMedium,
    color: COLORS.accent,
    marginBottom: SIZES.base,
  },
  reportDoctor: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
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
  },
  infoText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    marginLeft: SIZES.base,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: SIZES.base,
  },
}); 