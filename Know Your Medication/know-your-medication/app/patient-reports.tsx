import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import apiClient from './utils/apiClient';
import { API_URL } from './utils/config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PatientReportsScreen() {
  const { patientId, patientName } = useLocalSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(null); // Store ID of report being downloaded
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    if (!patientId) {
      setError('Patient ID is missing');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      const response = await apiClient.get(`/api/reports/patient/${patientId}`);
      
      setReports(response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load lab reports. Please try again later.');
      Alert.alert('Error', 'Could not load patient lab reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [patientId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'blood':
        return 'water';
      case 'urine':
        return 'flask';
      case 'xray':
        return 'body';
      case 'ct':
        return 'scan';
      case 'mri':
        return 'aperture';
      case 'ultrasound':
        return 'pulse';
      default:
        return 'document-text';
    }
  };

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

  const downloadReport = async (report) => {
    try {
      setDownloading(report._id);
      
      // Get auth token
      const authData = await AsyncStorage.getItem('auth-storage');
      let token = '';
      
      if (authData) {
        const { state } = JSON.parse(authData);
        if (state?.token) {
          token = state.token;
        }
      }
      
      if (!token) {
        setDownloading(null);
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }
      
      const fileExt = report.fileType === 'pdf' ? '.pdf' : '.jpg';
      const fileUri = FileSystem.documentDirectory + `report-${report._id}${fileExt}`;
      
      console.log('Downloading report to:', fileUri);
      
      // Create download with authentication header
      const downloadResumable = FileSystem.createDownloadResumable(
        `${API_URL}/api/reports/download/${report._id}`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const downloadResult = await downloadResumable.downloadAsync();
      
      if (!downloadResult || !downloadResult.uri) {
        throw new Error('Download failed');
      }
      
      setDownloading(null);
      
      // Check if file can be shared
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert('Success', 'File downloaded successfully to ' + downloadResult.uri);
      }
    } catch (error) {
      setDownloading(null);
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Could not download the report. Please try again.');
    }
  };

  const deleteReport = async (reportId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiClient.delete(`/api/reports/${reportId}`);
              
              // Refresh the list after deletion
              fetchReports();
              
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <View style={styles.reportTypeContainer}>
            <Ionicons name={getReportTypeIcon(item.reportType)} size={14} color={COLORS.accent} />
            <Text style={styles.reportType}>{getReportTypeName(item.reportType)}</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name={item.fileType === 'pdf' ? 'document' : 'image'} size={24} color={COLORS.accent} />
        </View>
      </View>
      
      <View style={styles.doctorSection}>
        <Ionicons name="person-outline" size={16} color={COLORS.textLight} />
        <Text style={styles.doctorName}>
          Uploaded by: Dr. {item.doctorId?.name || 'Unknown'}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => viewReport(item)}
        >
          <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.downloadButton]}
          onPress={() => downloadReport(item)}
          disabled={downloading === item._id}
        >
          {downloading === item._id ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <>
              <Ionicons name="download-outline" size={16} color={COLORS.accent} />
              <Text style={styles.downloadButtonText}>Download</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteReport(item._id)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleAddReport = () => {
    router.push({
      pathname: '/upload-report',
      params: { patientId, patientName }
    });
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
        <Text style={styles.headerTitle}>{patientName}'s Lab Reports</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddReport}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading lab reports...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchReports}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flask-outline" size={80} color={COLORS.grey} />
          <Text style={styles.emptyText}>No lab reports yet</Text>
          <Text style={styles.emptySubText}>
            Upload a lab report for this patient
          </Text>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleAddReport}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.uploadButtonText}>Upload Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
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
  addButton: {
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
  list: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.base,
  },
  dateText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  reportTitle: {
    ...FONTS.textLarge,
    color: COLORS.text,
    marginBottom: 2,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportType: {
    ...FONTS.textSmall,
    color: COLORS.accent,
    marginLeft: 4,
  },
  iconContainer: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.base,
    marginLeft: SIZES.base,
  },
  doctorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base,
    marginBottom: SIZES.padding,
    paddingBottom: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  doctorName: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.base,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  viewButton: {
    backgroundColor: COLORS.primary + '15',
  },
  viewButtonText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    marginLeft: 4,
  },
  downloadButton: {
    backgroundColor: COLORS.accent + '15',
  },
  downloadButtonText: {
    ...FONTS.textSmall,
    color: COLORS.accent,
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '15',
  },
  deleteButtonText: {
    ...FONTS.textSmall,
    color: COLORS.error,
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  errorText: {
    ...FONTS.textMedium,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SIZES.padding,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
  },
  retryButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginTop: SIZES.padding,
  },
  emptySubText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.base,
    marginBottom: SIZES.padding,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radiusMedium,
  },
  uploadButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
}); 