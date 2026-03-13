import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import TasksScreen from './src/screens/TasksScreen';
import RoomStatusScreen from './src/screens/RoomStatusScreen';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QualityScreen from './src/screens/QualityScreen';
import { offlineQueue } from './src/offlineQueue';
import NetInfo from '@react-native-community/netinfo';
import { Activity, ClipboardList, MessageSquare, Settings2, Wrench } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const HomeTabs = () => (
  <Tabs.Navigator screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
    <Tabs.Screen name="Rooms" component={RoomStatusScreen} options={{ tabBarIcon: ({ color, size }) => <Activity color={color} size={size} /> }} />
    <Tabs.Screen name="Quality" component={QualityScreen} options={{ tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
    <Tabs.Screen name="Maintenance" component={MaintenanceScreen} options={{ tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }} />
    <Tabs.Screen name="Messages" component={MessagesScreen} options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }} />
    <Tabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Settings2 color={color} size={size} /> }} />
  </Tabs.Navigator>
);

export default function App() {
  useEffect(() => {
    // Flush offline queue when connectivity returns
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) void offlineQueue.process();
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
