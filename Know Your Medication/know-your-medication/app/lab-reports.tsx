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
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import apiClient from './utils/apiClient';
import { API_URL } from './utils/config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LabReportsScreen() {
  const { user, token } = useContext(AuthContext) || {};
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(null); // Store ID of report being downloaded
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Fetching reports for patient');
      const response = await apiClient.get('/api/reports/patient');
      console.log('Reports response:', response.data);
      
      if (Array.isArray(response.data)) {
        setReports(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load lab reports. Please try again later.');
      Alert.alert('Error', 'Could not load your lab reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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
      console.log('Viewing report:', report._id);
      
      // Get the auth token
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
      
      // Use the WebBrowser module to open the report in a browser with token
      const result = await WebBrowser.openBrowserAsync(
        `${API_URL}/api/reports/view/${report._id}?token=${token}`
      );
      
      console.log('WebBrowser result:', result);
    } catch (error) {
      console.error('Error viewing report:', error);
      Alert.alert('Error', 'Could not open the report. Please try again.');
    }
  };

  const downloadReport = async (report) => {
    try {
      setDownloading(report._id);
      
      // Get the auth token
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View>
          <Text style={styles.dateText}>
            {formatDate(item.createdAt)}
          </Text>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <View style={styles.reportTypeContainer}>
            <Ionicons name={getReportTypeIcon(item.reportType)} size={14} color={COLORS.accent} />
            <Text style={styles.reportType}>{getReportTypeName(item.reportType)}</Text>
          </View>
          <View style={styles.reportIdContainer}>
            <Text style={styles.reportIdLabel}>Report ID:</Text>
            <Text style={styles.reportIdValue}>{item.reportId || 'Not available'}</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={item.fileType === 'pdf' ? 'document' : 'image'} 
            size={24} 
            color={COLORS.accent}
          />
        </View>
      </View>
      
      <View style={styles.doctorSection}>
        <Ionicons name="person-outline" size={16} color={COLORS.textLight} />
        <Text style={styles.doctorName}>
          Uploaded by: {item.doctorId?.name ? `Dr. ${item.doctorId.name}` : 'Unknown'}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => viewReport(item)}
        >
          <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
          <Text style={styles.viewButtonText}>View Report</Text>
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
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>My Lab Reports</Text>
        <View style={styles.emptyBox} />
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
            Lab reports from your doctors will appear here
          </Text>
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
  retryButton: {
    marginTop: SIZES.padding,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    backgroundColor: COLORS.primary,
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
    paddingHorizontal: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.titleMedium,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
  },
  emptySubText: {
    ...FONTS.textRegular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.base,
  },
  list: {
    padding: SIZES.padding,
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
    marginBottom: SIZES.padding,
  },
  dateText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  reportTitle: {
    ...FONTS.titleSmall,
    color: COLORS.text,
    marginBottom: 4,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportType: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    marginLeft: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  doctorName: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    paddingTop: SIZES.padding,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radiusSmall,
    flex: 1,
  },
  viewButton: {
    backgroundColor: COLORS.primaryLight,
    marginRight: SIZES.base,
  },
  downloadButton: {
    backgroundColor: COLORS.accentLight,
    marginLeft: SIZES.base,
  },
  viewButtonText: {
    ...FONTS.textSmall,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  downloadButtonText: {
    ...FONTS.textSmall,
    color: COLORS.accent,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reportIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reportIdLabel: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  reportIdValue: {
    ...FONTS.textSmall,
    color: COLORS.text,
    marginLeft: 4,
  },
}); 