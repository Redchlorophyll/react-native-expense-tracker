import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Wallet, TrendingUp, Settings, User } from 'lucide-react-native';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { InvestmentScreen } from '@/screens/InvestmentScreen';
import { InvestmentTransactionsScreen } from '@/screens/InvestmentTransactionsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { AccountScreen } from '@/screens/AccountScreen';
import { CycleDetailScreen } from '@/screens/CycleDetailScreen';
import { StatementUploadScreen } from '@/screens/StatementUploadScreen';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/types';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          title: 'Transaksi',
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Investment"
        component={InvestmentScreen}
        options={{
          title: 'Investasi',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={TabNavigator} />
      <RootStack.Screen name="CycleDetail" component={CycleDetailScreen} />
      <RootStack.Screen name="InvestmentTransactions" component={InvestmentTransactionsScreen} />
      <RootStack.Screen name="StatementUpload" component={StatementUploadScreen} />
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
