import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AlertProvider, useAlerts } from '@/src/application/context/AlertContext';
import {  colors  } from '@onalert/shared';

function RootNavigator() {
  const { isLoading, user } = useAlerts();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="index" />
        </Stack.Protected>

        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="report"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Reportar incidente',
              headerStyle: { backgroundColor: colors.secondary },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="incident/[id]"
            options={{
              headerShown: true,
              title: 'Detalle del incidente',
              headerStyle: { backgroundColor: colors.secondary },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <RootNavigator />
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});