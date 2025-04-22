import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  secureTextEntry,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  disabled = false,
  ...rest
}) => {
  const [secureText, setSecureText] = useState(secureTextEntry);

  const toggleSecureText = () => {
    setSecureText(!secureText);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error ? COLORS.error : COLORS.grey,
            backgroundColor: disabled ? COLORS.lightGrey : COLORS.white,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              textAlignVertical: multiline ? 'top' : 'center',
              height: multiline ? numberOfLines * 20 : 50,
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.grey}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secureText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={!disabled}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity style={styles.iconContainer} onPress={toggleSecureText}>
            <Ionicons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.grey}
            />
          </TouchableOpacity>
        )}
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.base * 2,
    width: '100%',
  },
  label: {
    ...FONTS.textRegular,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.base,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.text,
    ...FONTS.textRegular,
    paddingHorizontal: SIZES.base,
  },
  iconContainer: {
    padding: SIZES.base,
  },
  errorText: {
    ...FONTS.textSmall,
    color: COLORS.error,
    marginTop: SIZES.base / 2,
  },
});

export default CustomInput; 