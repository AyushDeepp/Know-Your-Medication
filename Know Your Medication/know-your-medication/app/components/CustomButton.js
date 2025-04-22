import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';

const CustomButton = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'filled', // filled, outlined, text
  color = COLORS.primary,
}) => {
  // Determine background color based on variant and disabled state
  const getBackgroundColor = () => {
    if (disabled) return COLORS.lightGrey;
    if (variant === 'filled') return color;
    return 'transparent';
  };

  // Determine text color based on variant and disabled state
  const getTextColor = () => {
    if (disabled) return COLORS.grey;
    if (variant === 'filled') return COLORS.white;
    return color;
  };

  // Determine border color based on variant and disabled state
  const getBorderColor = () => {
    if (disabled) return COLORS.lightGrey;
    if (variant === 'outlined') return color;
    return 'transparent';
  };

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: variant === 'outlined' ? 2 : 0,
    },
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={{ pointerEvents: 'none' }}>
        {loading ? (
          <ActivityIndicator size="small" color={getTextColor()} />
        ) : (
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.base * 3,
    borderRadius: SIZES.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  text: {
    ...FONTS.button,
  },
});

export default CustomButton; 