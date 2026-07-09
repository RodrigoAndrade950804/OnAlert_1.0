import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { IncidentCard } from '../../components/IncidentCard';
import { useAlerts } from '../../context/AlertContext';
import { colors, incidentTypeLabels } from '../../constants/theme';
import { formatDistance, getDistanceKm } from '../../utils/distance';
import { IncidentType } from '../../types';

const filters: (IncidentType | 'todos')[] = [
  'todos',
  'sos',
  'robo',
  'sospechoso',
  'incendio',
  'medica',
  'violencia',
  'accidente',
];

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return date.toLocaleDateString('es-EC');
}

export default function AlertsScreen() {
  const router = useRouter();
  const { incidents, userLocation } = useAlerts();
  const [filter, setFilter] = useState<IncidentType | 'todos'>('todos');

  const sortedIncidents = useMemo(() => {
    return [...incidents]
      .filter((i) => i.status === 'activo' || i.status === 'validado')
      .filter((i) => (filter === 'todos' ? true : i.type === filter))
      .sort((a, b) => {
        const priorityOrder = { alta: 0, media: 1, baja: 2 };
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [incidents, filter]);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item === 'todos' ? 'Todos' : incidentTypeLabels[item]}
            </Text>
          </Pressable>
        )}
      />

      <FlatList
        data={sortedIncidents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sin alertas activas</Text>
            <Text style={styles.emptyText}>
              No hay incidentes reportados en este momento.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const distance =
            userLocation &&
            formatDistance(getDistanceKm(userLocation, item.location));

          return (
            <Pressable onPress={() => router.push(`/incident/${item.id}`)}>
              <IncidentCard
                title={item.title}
                type={item.type}
                priority={item.priority}
                status={item.status}
                description={item.description}
                distance={distance || undefined}
                time={formatTime(item.createdAt)}
                reporterName={item.reporterName}
              />
            </Pressable>
          );
        }}
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
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
