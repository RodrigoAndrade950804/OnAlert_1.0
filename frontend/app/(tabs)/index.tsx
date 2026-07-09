import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SOSButton } from '@/src/presentation/components/SOSButton';
import { useAlerts } from '@/src/application/context/AlertContext';
import {  colors  } from '@onalert/shared';
import { getAddressFromCoords } from '@onalert/shared';

export default function HomeScreen() {
  const router = useRouter();
  const { user, incidents, sendSOS, setUserLocation, logout, isOffline, toggleOfflineMode, userLocation } = useAlerts();

  // Redirección de Inicio Inteligente según el rol
  if (user?.role === 'superadmin') {
    return <Redirect href="/admin" />;
  }
  if (user?.role === 'policia_upc') {
    return <Redirect href="/upc" />;
  }

  const [locationLabel, setLocationLabel] = useState('Obteniendo ubicación...');

  useEffect(() => {
    if (userLocation) {
      (async () => {
        const address = await getAddressFromCoords(userLocation);
        setLocationLabel(address);
      })();
    } else {
      setLocationLabel('Obteniendo ubicación...');
    }
  }, [userLocation]);

  const activeCount = incidents.filter((i) => i.status === 'activo').length;
  const highPriority = incidents.filter(
    (i) => i.priority === 'alta' && i.status === 'activo',
  ).length;

  const handleSOS = async () => {
    if (!userLocation) {
      if (Platform.OS === 'web') window.alert('Error: Obteniendo coordenadas GPS. Por favor espera o activa el GPS.');
      else Alert.alert('Error', 'Obteniendo coordenadas GPS. Por favor espera o activa el GPS.');
      return;
    }
    
    try {
      const address = await getAddressFromCoords(userLocation);
      const incident = await sendSOS(userLocation, address);
      
      const modeMsg = isOffline 
        ? 'Emitido localmente en la Red Mesh P2P con Relojes Lógicos.' 
        : 'Registrado en el Gateway y difundido por RabbitMQ.';

        // Esperamos 1.5s para que el usuario vea el botón verde de ¡ENVIADO! y luego navegamos
        setTimeout(() => {
          router.push(`/incident/${incident.id}`);
        }, 1500);
    } catch (err) {
      console.warn(err);
      if (Platform.OS === 'web') window.alert('Error al emitir SOS');
      else Alert.alert('Error', 'No se pudo emitir la alerta SOS.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name.split(' ')[0]}</Text>
          <Text style={styles.community}>{user?.community}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            onPress={toggleOfflineMode} 
            style={[styles.networkBtn, isOffline ? styles.networkBtnOffline : styles.networkBtnOnline]}
          >
            <Ionicons name={isOffline ? "wifi" : "cloud-done"} size={16} color="#fff" />
            <Text style={styles.networkBtnText}>{isOffline ? "Mesh P2P" : "Online"}</Text>
          </Pressable>
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={[styles.statCard, styles.statDanger]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{highPriority}</Text>
          <Text style={styles.statLabel}>Alta prioridad</Text>
        </View>
      </View>

      <View style={styles.sosSection}>
        <Text style={styles.sosTitle}>Botón de emergencia</Text>
        <Text style={styles.sosSubtitle}>
          Presiona para alertar a toda la comunidad en menos de 2 segundos
        </Text>
        <SOSButton onPress={handleSOS} />
      </View>

      <View style={styles.locationCard}>
        <Ionicons name="location" size={20} color={colors.primary} />
        <View style={styles.locationText}>
          <Text style={styles.locationLabel}>Tu ubicación</Text>
          <Text style={styles.locationValue} numberOfLines={2}>
            {locationLabel}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => router.push('/report')}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Reportar incidente</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => router.push('/(tabs)/alerts')}>
          <Ionicons name="notifications" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Ver alertas</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  networkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  networkBtnOnline: {
    backgroundColor: '#10B981', // Emerald green
  },
  networkBtnOffline: {
    backgroundColor: '#F59E0B', // Amber orange
  },
  networkBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  community: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statDanger: {
    borderColor: colors.primaryLight,
    backgroundColor: '#FFF5F5',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sosSection: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sosSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  locationValue: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
