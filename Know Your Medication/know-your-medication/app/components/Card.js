import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const Card = ({
  children,
  style,
  onPress,
  disabled = false,
  shadow = 'small', // small, medium, large, none
  ...rest
}) => {
  // Get shadow style based on shadow prop
  const getShadowStyle = () => {
    if (shadow === 'none') return {};
    
    // Define shadow styles directly to avoid the deprecated shadow* warning
    if (shadow === 'medium') {
      return {
        // For React Native Web
        boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.15)',
        // For iOS
        shadowColor: COLORS.black,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        // For Android
        elevation: 5,
      };
    } else if (shadow === 'large') {
      return {
        // For React Native Web
        boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.2)',
        // For iOS
        shadowColor: COLORS.black,
        shadowOffset: {
          width: 0,
          height: 6,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        // For Android
        elevation: 10,
      };
    } else {
      // Default to small shadow
      return {
        // For React Native Web
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
        // For iOS
        shadowColor: COLORS.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        // For Android
        elevation: 2,
      };
    }
  };

  // If onPress is provided, make card touchable
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, getShadowStyle(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Otherwise, render as regular View
  return (
    <View style={[styles.card, getShadowStyle(), style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.padding,
    marginVertical: SIZES.base,
  },
});

export default Card; 