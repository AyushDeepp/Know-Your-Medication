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
  TextInput,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Card from './components/Card';
import axios from 'axios';
import { API_URL } from './utils/config';

const UserItem = ({ user, onPress }) => {
  const getStatusColor = () => {
    if (user.role === 'doctor' && !user.isApproved) {
      return COLORS.warning;
    }
    return COLORS.success; // All other users are considered active
  };

  const getRoleIcon = () => {
    switch(user.role) {
      case 'patient': return 'person-outline';
      case 'doctor': return 'medkit-outline';
      case 'admin': return 'settings-outline';
      default: return 'person-outline';
    }
  };

  // Format the status for display
  const getStatusText = () => {
    if (user.role === 'doctor' && !user.isApproved) {
      return 'Pending Approval';
    }
    return 'Active';
  };

  // Navigate directly to user details
  const handleCardPress = () => {
    router.push({
      pathname: '/user-details',
      params: { userId: user._id }
    });
  };

  return (
    <Card style={styles.userCard} onPress={handleCardPress} shadow="small">
      <View style={styles.userInfoContainer}>
        <View style={[styles.iconContainer, { backgroundColor: COLORS[user.role] + '20' }]}>
          <Ionicons name={getRoleIcon()} size={24} color={COLORS[user.role]} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userDetails}>
            <View style={styles.roleContainer}>
              <Text style={styles.roleText}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
            <View style={[styles.statusContainer, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
    </Card>
  );
};

export default function ManageUsersScreen() {
  const { user, token } = useContext(AuthContext) || {};
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load users');
      setLoading(false);
      console.error('Error fetching users:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    // Check if current user is admin
    if (!user || user.role !== 'admin') {
      Alert.alert('Unauthorized', 'You do not have permission to access this page');
      router.replace('/home');
      return;
    }

    fetchUsers();
  }, [user, token]);

  // Filter users based on active tab and search query
  const getFilteredUsers = () => {
    let filtered = [...users];
    
    // Apply role filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab);
    }
    
    // Apply search filter if there's a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Get counts for each role category
  const getUserCounts = () => {
    const counts = {
      all: users.length,
      doctor: users.filter(u => u.role === 'doctor').length,
      patient: users.filter(u => u.role === 'patient').length,
      admin: users.filter(u => u.role === 'admin').length,
      pendingDoctors: users.filter(u => u.role === 'doctor' && !u.isApproved).length
    };
    return counts;
  };

  const handleUserPress = (user) => {
    Alert.alert(
      'User Actions',
      `What would you like to do with ${user.name}?`,
      [
        { text: 'View Profile', onPress: () => viewUserProfile(user) },
        ...(user.role === 'doctor' && !user.isApproved ? [
          { 
            text: 'Approve Doctor', 
            onPress: () => approveDoctor(user._id) 
          }
        ] : []),
        { 
          text: 'Delete User', 
          onPress: () => confirmDeleteUser(user._id, user.name),
          style: 'destructive' 
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const viewUserProfile = (user) => {
    // Navigate to user details screen
    router.push({
      pathname: '/user-details',
      params: { userId: user._id }
    });
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
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error('Error approving doctor:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to approve doctor. Please try again.');
      setLoading(false);
    }
  };

  const confirmDeleteUser = (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteUser(userId),
          style: 'destructive'
        }
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      Alert.alert('Success', 'User has been deleted');
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to delete user. Please try again.');
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={styles.emptyBox} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={22} color={COLORS.grey} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={22} color={COLORS.grey} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Role Tabs */}
      <View style={styles.tabsContainer}>
        {['all', 'doctor', 'patient', 'admin', 'pendingDoctors'].map((tab) => {
          const counts = getUserCounts();
          return (
            <TouchableOpacity 
              key={tab} 
              style={[
                styles.tab, 
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText, 
                activeTab === tab && styles.activeTabText
              ]}>
                {tab === 'all' ? 'All' : 
                 tab === 'doctor' ? 'Doctors' : 
                 tab === 'patient' ? 'Patients' : 
                 tab === 'admin' ? 'Admins' : 
                 'Pending Doctors'}
                {' '}
                <Text style={styles.countText}>({counts[tab]})</Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchUsers}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredUsers()}
          renderItem={({ item }) => (
            <UserItem user={item} onPress={() => handleUserPress(item)} />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={COLORS.lightGrey} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'No users match your search criteria.' 
                  : activeTab !== 'all' 
                    ? `No ${activeTab} users available.` 
                    : 'No users available.'}
              </Text>
            </View>
          )}
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
  listContainer: {
    padding: SIZES.padding,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...FONTS.textMedium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userEmail: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginBottom: SIZES.base / 2,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleContainer: {
    backgroundColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    marginRight: SIZES.base,
  },
  roleText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  statusContainer: {
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
  },
  statusText: {
    ...FONTS.textSmall,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  emptyTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  emptyText: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.padding / 2,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  searchInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: SIZES.padding / 2,
    ...FONTS.body3,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  tab: {
    paddingVertical: SIZES.padding / 2,
    paddingHorizontal: SIZES.padding,
    marginRight: SIZES.padding / 2,
    marginBottom: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGrey + '50',
  },
  activeTab: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    ...FONTS.body4,
    color: COLORS.darkgrey,
  },
  activeTabText: {
    ...FONTS.body4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  countText: {
    ...FONTS.body4,
    color: COLORS.grey,
  },
  retryButton: {
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    marginTop: SIZES.padding,
  },
  retryButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    textAlign: 'center',
  },
  emptyBox: {
    width: 32,
  },
}); 