import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import codePush from 'react-native-code-push';

import { AppProvider, useAppContext } from './src/context/AppContext';
import ReportScreen from './src/screens/ReportScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function NavigationTabs() {
  const { isInitialized, isOnline } = useAppContext();

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Report') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isOnline ? '#4CAF50' : '#FF9800',
                marginRight: 8,
              }}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          title: 'Report Hazard',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

function AppRoot() {
  return (
    <AppProvider>
      <NavigationContainer>
        <NavigationTabs />
      </NavigationContainer>
    </AppProvider>
  );
}

export default codePush(AppRoot);
