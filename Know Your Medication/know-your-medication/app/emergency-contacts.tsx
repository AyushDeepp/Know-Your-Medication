import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SIZES } from './utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';
import { API_URL } from './utils/config';

export default function EmergencyContactsScreen() {
  const { token } = useContext(AuthContext) || {};
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phoneNumber: '',
    isPrimary: false,
  });

  useEffect(() => {
    fetchEmergencyContacts();
  }, [token]);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Get emergency contacts from user profile
      const emergencyContacts = response.data.profile?.emergencyContacts || [];
      setContacts(emergencyContacts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load emergency contacts. Please try again.');
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    setIsEditing(false);
    setCurrentContact(null);
    setFormData({
      name: '',
      relationship: '',
      phoneNumber: '',
      isPrimary: false,
    });
    setModalVisible(true);
  };

  const handleEditContact = (contact) => {
    setIsEditing(true);
    setCurrentContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      isPrimary: contact.isPrimary,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleTogglePrimary = () => {
    setFormData({
      ...formData,
      isPrimary: !formData.isPrimary,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return false;
    }
    if (!formData.relationship.trim()) {
      Alert.alert('Error', 'Please enter a relationship');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return false;
    }
    return true;
  };

  const handleSaveContact = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (isEditing && currentContact) {
        // Update existing contact
        const response = await axios.put(
          `${API_URL}/api/users/emergency-contacts`,
          {
            contactId: currentContact._id,
            name: formData.name,
            relationship: formData.relationship,
            phoneNumber: formData.phoneNumber,
            isPrimary: formData.isPrimary,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        setContacts(response.data.emergencyContacts);
        Alert.alert('Success', 'Emergency contact updated successfully');
      } else {
        // Add new contact
        const response = await axios.post(
          `${API_URL}/api/users/emergency-contacts`,
          {
            name: formData.name,
            relationship: formData.relationship,
            phoneNumber: formData.phoneNumber,
            isPrimary: formData.isPrimary,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        setContacts(response.data.emergencyContacts);
        Alert.alert('Success', 'Emergency contact added successfully');
      }
      
      setModalVisible(false);
      setLoading(false);
    } catch (error) {
      console.error('Error saving emergency contact:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to save emergency contact. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteContact = (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await axios.delete(
                `${API_URL}/api/users/emergency-contacts/${contactId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              
              setContacts(response.data.emergencyContacts);
              Alert.alert('Success', 'Emergency contact deleted successfully');
              setLoading(false);
            } catch (error) {
              console.error('Error deleting emergency contact:', error.response?.data || error.message);
              Alert.alert('Error', 'Failed to delete emergency contact. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderContactItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactCard}
      onPress={() => handleEditContact(item)}
    >
      <View style={styles.contactInfo}>
        <View style={[styles.iconContainer, item.isPrimary && styles.primaryIconContainer]}>
          <Ionicons 
            name="person-outline" 
            size={24} 
            color={item.isPrimary ? COLORS.white : COLORS.primary} 
          />
        </View>
        <View style={styles.contactDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName}>{item.name}</Text>
            {item.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
          </View>
          <Text style={styles.contactRelationship}>{item.relationship}</Text>
          <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteContact(item._id)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={80} color={COLORS.lightGrey} />
      <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
      <Text style={styles.emptyText}>
        Add emergency contacts that can be reached in case of an emergency.
      </Text>
      <TouchableOpacity 
        style={styles.addEmptyButton}
        onPress={handleAddContact}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.addEmptyButtonText}>Add Contact</Text>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddContact}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
        />
      )}
      
      {/* Add/Edit Contact Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Contact' : 'Add Contact'}</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  value={formData.relationship}
                  onChangeText={(text) => handleInputChange('relationship', text)}
                  placeholder="e.g. Spouse, Parent, Sibling"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) => handleInputChange('phoneNumber', text)}
                  placeholder="Phone Number"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="phone-pad"
                />
              </View>
              
              <TouchableOpacity
                style={styles.primaryToggle}
                onPress={handleTogglePrimary}
              >
                <View style={styles.checkboxContainer}>
                  <View 
                    style={[
                      styles.checkbox, 
                      formData.isPrimary && styles.checkboxChecked
                    ]}
                  >
                    {formData.isPrimary && (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={styles.primaryToggleText}>Set as primary contact</Text>
                </View>
                <Text style={styles.primaryHelperText}>
                  Primary contact will be displayed on your profile
                </Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  listContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 5,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  primaryIconContainer: {
    backgroundColor: COLORS.primary,
  },
  contactDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactName: {
    ...FONTS.textMedium,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  primaryBadge: {
    backgroundColor: COLORS.success + '20',
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    marginLeft: SIZES.base,
  },
  primaryText: {
    ...FONTS.textSmall,
    color: COLORS.success,
    fontWeight: '500',
  },
  contactRelationship: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  contactPhone: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
  },
  deleteButton: {
    padding: SIZES.base,
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
  addEmptyButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    alignItems: 'center',
  },
  addEmptyButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
    marginLeft: SIZES.base / 2,
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
    padding: SIZES.padding,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  modalTitle: {
    ...FONTS.titleMedium,
    color: COLORS.text,
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  inputLabel: {
    ...FONTS.textMedium,
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: SIZES.radiusSmall,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  primaryToggle: {
    marginBottom: SIZES.padding,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: SIZES.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  primaryToggleText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  primaryHelperText: {
    ...FONTS.textSmall,
    color: COLORS.textLight,
    marginLeft: 28,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SIZES.padding,
  },
  modalButton: {
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    marginLeft: SIZES.base,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGrey,
  },
  cancelButtonText: {
    ...FONTS.textMedium,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    ...FONTS.textMedium,
    color: COLORS.white,
  },
}); 