import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAlerts } from '@/src/application/context/AlertContext';
import { SuperAdminDashboard } from '@/src/presentation/components/admin/SuperAdminDashboard';
import { LocalAdminDashboard } from '@/src/presentation/components/admin/LocalAdminDashboard';
import {  colors  } from '@onalert/shared';

export default function AdminScreen() {
  const { user } = useAlerts();

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>No autenticado.</Text>
      </View>
    );
  }

  // Patrón SOLID: Principio de Responsabilidad Única.
  // Este componente actúa solo como Enrutador (Router) de UI basándose en el Rol.
  if (user.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  if (user.role === 'admin') {
    return <LocalAdminDashboard />;
  }

  // Acceso denegado (Fall-back de seguridad)
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>No tienes permisos para ver esta pantalla.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontWeight: '600',
  }
});
