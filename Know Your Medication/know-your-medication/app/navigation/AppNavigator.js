import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../utils/theme';
import { AuthContext } from '../context/AuthContext';

// Auth Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Common Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Define stacks
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator (when not logged in)
const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Tab Navigator (when logged in)
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Medications') {
          iconName = focused ? 'medical' : 'medical-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.grey,
      tabBarLabelStyle: {
        ...FONTS.textSmall,
        fontWeight: '500',
      },
      tabBarStyle: {
        height: 60,
        paddingBottom: 10,
        paddingTop: 10,
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    {/* Will implement these screens later */}
    <Tab.Screen name="Medications" component={PlaceholderScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Placeholder for screens not yet implemented
const PlaceholderScreen = () => null;

// Main App Navigator
const AppNavigator = () => {
  const { userToken, isLoading } = useContext(AuthContext);

  // If app is loading, return null or a loading screen
  if (isLoading) {
    return null; // You can replace this with a loading screen component
  }

  return (
    <NavigationContainer>
      {userToken ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          {/* Add more screens accessible from the tab navigator here */}
          <Stack.Screen name="ProfileDetails" component={ProfileScreen} />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator; 