import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { useAlerts } from '@/src/application/context/AlertContext';
import { canManageIncidents } from '@onalert/shared';
import {  colors  } from '@onalert/shared';

export default function TabLayout() {
  const { user, logout } = useAlerts();
  const isManager = user ? canManageIncidents(user.role) : false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: colors.secondary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => (
          <Pressable onPress={logout} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          href: (user?.role === 'superadmin' || user?.role === 'policia_upc') ? null : '/',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: user?.role === 'superadmin' ? 'Inicio' : 'Panel Admin',
          href: (user?.role === 'superadmin' || user?.role === 'admin') ? '/admin' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={user?.role === 'superadmin' ? "home" : "people"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upc"
        options={{
          title: 'UPC Central',
          href: user?.role === 'policia_upc' ? '/upc' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}