import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, Alert, Platform } from 'react-native';
import { IncidentCard } from '@/src/presentation/components/IncidentCard';
import { useAlerts } from '@/src/application/context/AlertContext';
import {  colors  } from '@onalert/shared';

export default function UPCScreen() {
  const router = useRouter();
  const { incidents, updateStatus, sendMessage, user } = useAlerts();

  // Todos los incidentes descargados ya pertenecen a la comunidad del UPC gracias al backend (tenant_id)
  const sectorIncidents = incidents;
  const pending = sectorIncidents.filter((i) => i.status === 'activo');
  const inProgress = sectorIncidents.filter((i) => i.status === 'en_progreso' || i.status === 'atendido');
  const managed = sectorIncidents.filter(
    (i) => i.status === 'validado' || i.status === 'rechazado' || i.status === 'cerrado',
  );

  const criticalCount = pending.filter(i => i.priority === 'alta').length;

  const handleEnCamino = async (id: string) => {
    updateStatus(id, 'en_progreso');
    await sendMessage(id, '👮‍♂️ Unidad UPC ha recibido la alerta y va en camino. Mantenga la calma.');
    if (Platform.OS === 'web') {
      window.alert('¡Alerta de estado enviada! Notificando a los vecinos que vas en camino.');
    } else {
      Alert.alert('Recibido', '¡Alerta de estado enviada! Notificando a los vecinos que vas en camino.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Central UPC: {user?.community}</Text>
        <Text style={styles.summaryText}>
          {criticalCount} incidentes críticos requieren atención
        </Text>
      </View>

      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          pending.length > 0 ? (
            <Text style={styles.sectionTitle}>Emergencias Activas</Text>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay emergencias en este sector</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <Pressable onPress={() => router.push(`/incident/${item.id}`)}>
              <IncidentCard
                title={item.title}
                type={item.type}
                priority={item.priority}
                status={item.status}
                description={item.description}
                time={new Date(item.createdAt).toLocaleString('es-EC')}
                reporterName={item.reporterName}
                address={item.address}
              />
            </Pressable>
            {item.priority === 'alta' && (
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
                ⚠️ INCIDENTE CRÍTICO
              </Text>
            )}
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: '#FEF9C3' }]}
                onPress={() => handleEnCamino(item.id)}
              >
                <Text style={{ color: '#854D0E', fontWeight: 'bold', fontSize: 13 }}>En camino / Recibido</Text>
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListFooterComponent={
          <>
            {inProgress.length > 0 && (
              <View style={styles.footer}>
                <Text style={styles.sectionTitle}>En Progreso / En camino</Text>
                {inProgress.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/incident/${item.id}`)}
                    style={{ marginBottom: 12 }}
                  >
                    <IncidentCard
                      title={item.title}
                      type={item.type}
                      priority={item.priority}
                      status={item.status}
                      description={item.description}
                      time={new Date(item.createdAt).toLocaleString('es-EC')}
                      reporterName={item.reporterName}
                      address={item.address}
                    />
                  </Pressable>
                ))}
              </View>
            )}
            {managed.length > 0 && (
              <View style={styles.footer}>
                <Text style={styles.sectionTitle}>Patrullados recientemente</Text>
                {managed.slice(0, 5).map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/incident/${item.id}`)}
                    style={{ marginBottom: 12 }}
                  >
                    <IncidentCard
                      title={item.title}
                      type={item.type}
                      priority={item.priority}
                      status={item.status}
                      description={item.description}
                      time={new Date(item.createdAt).toLocaleString('es-EC')}
                      reporterName={item.reporterName}
                      address={item.address}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summary: {
    backgroundColor: '#0F172A', // Darker blue for police
    padding: 20,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  cardWrap: {
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  validateBtn: {
    backgroundColor: '#DCFCE7',
  },
  validateText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
  rejectBtn: {
    backgroundColor: '#F1F5F9',
  },
  rejectText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  closeBtn: {
    backgroundColor: '#DBEAFE',
  },
  closeText: {
    color: colors.info,
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    marginTop: 24,
  },
});
