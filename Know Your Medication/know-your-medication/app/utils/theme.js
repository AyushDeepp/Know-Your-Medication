import { Dimensions, Platform } from 'react-native';

export const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#4361EE',
  secondary: '#3F8EFC',
  accent: '#F72585',
  background: '#F7F9FC',
  white: '#FFFFFF',
  black: '#000000',
  text: '#333333',
  textLight: '#666666',
  grey: '#AEAEAE',
  lightGrey: '#E5E5E5',
  green: '#4CAF50',
  red: '#F44336',
  yellow: '#FFC107',
  error: '#FF5252',
  success: '#4CAF50',
  info: '#2196F3',
  warning: '#FFC107',
  card: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // User role colors
  patient: '#4361EE',
  doctor: '#4CAF50',
  admin: '#F72585'
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  xxl: 32,
  
  // Radius
  radiusSmall: 4,
  radiusMedium: 8,
  radiusLarge: 12,
  
  // Padding
  padding: 16,
};

export const FONTS = {
  titleLarge: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
  },
  titleMedium: {
    fontSize: SIZES.extraLarge,
    fontWeight: 'bold',
  },
  titleSmall: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  textRegular: {
    fontSize: SIZES.font,
  },
  textMedium: {
    fontSize: SIZES.medium,
  },
  textSmall: {
    fontSize: SIZES.small,
  },
  button: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
};

// Native shadows
export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
};

// Web shadows (for styled components or inline styles)
export const WEB_SHADOWS = {
  small: '0px 2px 3px rgba(0, 0, 0, 0.1)',
  medium: '0px 4px 5px rgba(0, 0, 0, 0.15)',
  large: '0px 6px 8px rgba(0, 0, 0, 0.2)',
};

// Helper function to get the right shadow based on platform
export const getShadow = (size = 'small') => {
  if (Platform.OS === 'web') {
    return { boxShadow: WEB_SHADOWS[size] };
  }
  return SHADOWS[size];
};

// Default export for Expo Router
export default function Theme() {
  return null; // This component is not meant to be rendered directly
} 