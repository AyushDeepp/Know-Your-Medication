import React from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../utils/theme';
import { API_URL } from '../utils/config';

const ProfilePicture = ({ 
  uri, 
  size = 80, 
  name = '', 
  loading = false, 
  showEditButton = false,
  role = '', 
  onPress = null,
  style = {}
}) => {
  // Get first letter of name for placeholder
  const nameInitial = name ? name.charAt(0).toUpperCase() : '';
  
  // Calculate container styles based on size
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  
  // Calculate text size based on avatar size
  const fontSize = size / 2.5;
  
  // Get background color for avatar container based on role
  const getBackgroundColor = () => {
    // Use role color if provided, otherwise use primary
    if (role === 'doctor') return COLORS.accent + '40';
    if (role === 'admin') return COLORS.warning + '40';
    if (role === 'patient') return COLORS.success + '40';
    return COLORS.primary + '40';
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  // With profile picture
  if (uri) {
    // Format URI if it's a relative path from the API
    const formattedUri = uri.startsWith('http') ? uri : `${API_URL}/${uri}`;
    
    return (
      <View style={[styles.wrapper, style]}>
        <Image 
          source={{ uri: formattedUri }} 
          style={[styles.image, containerStyle]} 
        />
        {showEditButton && (
          <View style={styles.editButton}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        )}
      </View>
    );
  }

  // Without profile picture - show placeholder with initial
  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.container, containerStyle, { backgroundColor: getBackgroundColor() }]}>
        {nameInitial ? (
          <Text style={[styles.initialText, { fontSize }]}>{nameInitial}</Text>
        ) : (
          <Ionicons name="person" size={size/2} color={COLORS.lightGrey} />
        )}
      </View>
      {showEditButton && (
        <View style={styles.editButton}>
          <Ionicons name="camera" size={14} color="#FFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey + '30',
  },
  image: {
    backgroundColor: COLORS.lightGrey + '20',
  },
  initialText: {
    ...FONTS.titleMedium,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary + '80',
    borderRadius: 20,
    padding: 4,
  }
});

export default ProfilePicture; 