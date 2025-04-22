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
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';
import { API_URL } from './utils/config';

export default function MyDoctorsScreen() {
  const { user, token } = useContext(AuthContext) || {};
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/my-doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setDoctors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load your doctors. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDoctors();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyDoctors();
    setRefreshing(false);
  };

  const getSpecialtyIcon = (specialty) => {
    if (!specialty) return 'medical-outline';
    
    const specialtyLower = specialty.toLowerCase();
    
    if (specialtyLower.includes('cardio')) return 'heart-outline';
    if (specialtyLower.includes('neuro')) return 'brain-outline';
    if (specialtyLower.includes('ortho')) return 'body-outline';
    if (specialtyLower.includes('pedia')) return 'people-outline';
    if (specialtyLower.includes('derm')) return 'eyedrop-outline';
    if (specialtyLower.includes('eye') || specialtyLower.includes('ophthal')) return 'eye-outline';
    if (specialtyLower.includes('dent')) return 'tooth-outline';
    if (specialtyLower.includes('psych')) return 'happy-outline';
    
    return 'medical-outline';
  };

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => router.push({
        pathname: '/doctor-profile',
        params: { doctorId: item._id }
      })}
    >
      <View style={styles.doctorInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons 
            name={getSpecialtyIcon(item.specialty)} 
            size={32} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialty || 'General Practitioner'}</Text>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.contactText}>{item.email}</Text>
          </View>
          {item.phone && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.contactText}>{item.phone}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.doctorActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color={COLORS.lightGrey} />
      <Text style={styles.emptyTitle}>No Doctors Found</Text>
      <Text style={styles.emptyText}>
        You haven't been added as a patient by any doctors yet.
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
        <Text style={styles.headerTitle}>My Doctors</Text>
        <View style={styles.emptyBox} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctorItem}
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
  listContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 5,
  },
  doctorCard: {
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
  doctorInfo: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    ...FONTS.textLarge,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  doctorSpecialty: {
    ...FONTS.textMedium,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: SIZES.base / 2,
  },
  doctorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    paddingTop: SIZES.padding,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
}); 