import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { IncidentCard } from '../../components/IncidentCard';
import { useAlerts } from '../../context/AlertContext';
import { colors } from '../../constants/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { incidents } = useAlerts();

  const stats = useMemo(() => {
    const total = incidents.length;
    const byType = incidents.reduce<Record<string, number>>((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {});
    const closed = incidents.filter((i) => i.status === 'cerrado').length;
    return { total, byType, closed };
  }, [incidents]);

  const sorted = useMemo(
    () =>
      [...incidents].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [incidents],
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsPanel}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total reportes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.closed}</Text>
          <Text style={styles.statLabel}>Cerrados</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>
            {Object.keys(stats.byType).length}
          </Text>
          <Text style={styles.statLabel}>Tipos distintos</Text>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Historial de incidentes</Text>
        }
        renderItem={({ item }) => (
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
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsPanel: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
