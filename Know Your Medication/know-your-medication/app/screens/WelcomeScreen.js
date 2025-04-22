import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar } from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import CustomButton from '../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Ionicons name="medkit" size={150} color={COLORS.primary} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Know Your Medication</Text>
          <Text style={styles.subtitle}>
            Your complete healthcare companion providing detailed medication information, 
            prescription management, and seamless doctor-patient communication.
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Get Started"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SIZES.padding * 2,
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  logo: {
    width: 150,
    height: 150,
  },
  textContainer: {
    marginBottom: SIZES.padding * 2,
  },
  title: {
    ...FONTS.titleLarge,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  subtitle: {
    ...FONTS.textMedium,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    width: '70%',
  },
});

export default WelcomeScreen; 