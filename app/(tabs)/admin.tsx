import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { IncidentCard } from '../../components/IncidentCard';
import { useAlerts } from '../../context/AlertContext';
import { colors } from '../../constants/theme';

export default function AdminScreen() {
  const router = useRouter();
  const { incidents, updateStatus } = useAlerts();

  const pending = incidents.filter((i) => i.status === 'activo');
  const managed = incidents.filter(
    (i) => i.status === 'validado' || i.status === 'rechazado' || i.status === 'cerrado',
  );

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Panel de monitoreo</Text>
        <Text style={styles.summaryText}>
          {pending.length} incidentes pendientes de validación
        </Text>
      </View>

      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          pending.length > 0 ? (
            <Text style={styles.sectionTitle}>Pendientes</Text>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay incidentes pendientes</Text>
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
              />
            </Pressable>
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionBtn, styles.validateBtn]}
                onPress={() => updateStatus(item.id, 'validado')}
              >
                <Text style={styles.validateText}>Validar</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => updateStatus(item.id, 'rechazado')}
              >
                <Text style={styles.rejectText}>Rechazar</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.closeBtn]}
                onPress={() => updateStatus(item.id, 'cerrado')}
              >
                <Text style={styles.closeText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListFooterComponent={
          managed.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.sectionTitle}>Gestionados recientemente</Text>
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
                  />
                </Pressable>
              ))}
            </View>
          ) : null
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
    backgroundColor: colors.secondary,
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
