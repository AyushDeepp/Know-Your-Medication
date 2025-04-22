import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from './components/Card';
import CustomButton from './components/CustomButton';
import axios from 'axios';
import { API_URL } from './utils/config';

const DoctorRequestItem = ({ request, onApprove, onReject, onViewDetails }) => {
  const getStatusColor = () => {
    switch(request.isApproved) {
      case true: return COLORS.success;
      case false: return COLORS.warning;
      default: return COLORS.warning;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()}`;
  };

  return (
    <Card style={styles.requestCard} shadow="small">
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.doctorName}>{request.name}</Text>
          <Text style={styles.doctorEmail}>{request.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {request.isApproved ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Specialization:</Text>
          <Text style={styles.detailValue}>{request.profile?.specialization || 'Not provided'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>License #:</Text>
          <Text style={styles.detailValue}>{request.profile?.licenseNumber || 'Not provided'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Request Date:</Text>
          <Text style={styles.detailValue}>{formatDate(request.createdAt)}</Text>
        </View>
      </View>
      
      {!request.isApproved && (
        <View style={styles.actionButtons}>
          <CustomButton
            title="Approve"
            onPress={() => onApprove(request)}
            color={COLORS.success}
            style={styles.actionButton}
          />
          <CustomButton
            title="Reject"
            onPress={() => onReject(request)}
            color={COLORS.error}
            style={styles.actionButton}
          />
          <CustomButton
            title="Details"
            onPress={() => onViewDetails(request)}
            variant="outlined"
            style={styles.actionButton}
          />
        </View>
      )}
      
      {request.isApproved && (
        <CustomButton
          title="View Details"
          onPress={() => onViewDetails(request)}
          variant="outlined"
          style={[styles.actionButton, { alignSelf: 'flex-end' }]}
        />
      )}
    </Card>
  );
};

export default function DoctorRequestsScreen() {
  const { user, token } = useContext(AuthContext) || {};
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/doctor-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load doctor requests');
      setLoading(false);
      console.error('Error fetching doctor requests:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    // Check if current user is admin
    if (!user || user.role !== 'admin') {
      Alert.alert('Unauthorized', 'You do not have permission to access this page');
      router.replace('/home');
      return;
    }

    fetchRequests();
  }, [user, token]);

  const handleApprove = (request) => {
    Alert.alert(
      'Approve Doctor',
      `Are you sure you want to approve ${request.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => approveDoctor(request._id) 
        }
      ]
    );
  };

  const approveDoctor = async (doctorId) => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/users/approve-doctor`, 
        { doctorId, isApproved: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      Alert.alert('Success', 'Doctor has been approved');
      // Refresh the doctor requests
      fetchRequests();
    } catch (error) {
      console.error('Error approving doctor:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to approve doctor. Please try again.');
      setLoading(false);
    }
  };

  const handleReject = (request) => {
    Alert.alert(
      'Reject Doctor',
      `Are you sure you want to reject ${request.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          onPress: () => rejectDoctor(request._id),
          style: 'destructive' 
        }
      ]
    );
  };

  const rejectDoctor = async (doctorId) => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/users/approve-doctor`, 
        { doctorId, isApproved: false },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      Alert.alert('Success', 'Doctor has been rejected');
      // Refresh the doctor requests
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting doctor:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to reject doctor. Please try again.');
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    const specialization = request.profile?.specialization || 'Not provided';
    const licenseNumber = request.profile?.licenseNumber || 'Not provided';
    const phoneNumber = request.profile?.phoneNumber || 'Not provided';
    
    Alert.alert(
      'Doctor Details',
      `Name: ${request.name}\nEmail: ${request.email}\nSpecialization: ${specialization}\nLicense: ${licenseNumber}\nPhone: ${phoneNumber}\nStatus: ${request.isApproved ? 'Approved' : 'Pending'}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Requests</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical-outline" size={80} color={COLORS.grey} />
          <Text style={styles.emptyText}>No doctor requests found</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={({ item }) => (
            <DoctorRequestItem 
              request={item}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.requestList}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  errorText: {
    ...FONTS.textMedium,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.titleMedium,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
  },
  requestList: {
    padding: SIZES.padding,
  },
  requestCard: {
    marginBottom: SIZES.padding,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  doctorName: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  doctorEmail: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  statusBadge: {
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
  },
  statusText: {
    ...FONTS.textSmall,
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: SIZES.padding,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: SIZES.base / 2,
  },
  detailLabel: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    width: 100,
  },
  detailValue: {
    ...FONTS.textSmall,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: SIZES.base,
    minWidth: 80,
  },
}); 