import { useState, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { IncidentCard } from '@/src/presentation/components/IncidentCard';
import { useAlerts } from '@/src/application/context/AlertContext';
import { colors } from '@onalert/shared';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const router = useRouter();
  const { incidents, user, deleteIncident } = useAlerts();
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'cerrado'>('todos');

  const stats = useMemo(() => {
    const total = incidents.length;
    const byType = incidents.reduce<Record<string, number>>((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {});
    const closed = incidents.filter((i) => i.status === 'cerrado').length;
    return { total, byType, closed };
  }, [incidents]);

  const sorted = useMemo(() => {
    let filtered = [...incidents];
    if (statusFilter === 'activo') {
      filtered = filtered.filter(i => i.status !== 'cerrado' && i.status !== 'falsa_alarma');
    } else if (statusFilter === 'cerrado') {
      filtered = filtered.filter(i => i.status === 'cerrado');
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [incidents, statusFilter]);

  const handleDelete = (id: string) => {
    const confirmDelete = () => {
      deleteIncident(id);
      if (Platform.OS === 'web') window.alert('Incidente eliminado');
    };
    
    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que deseas eliminar este incidente cerrado?')) confirmDelete();
    } else {
      Alert.alert('Eliminar Incidente', '¿Estás seguro de que deseas eliminar este reporte?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
      ]);
    }
  };

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
          <View>
            <Text style={styles.sectionTitle}>Historial de incidentes</Text>
            <View style={styles.filterTabs}>
              {(['todos', 'activo', 'cerrado'] as const).map(f => (
                <Pressable 
                  key={f} 
                  style={[styles.tab, statusFilter === f && styles.tabActive]}
                  onPress={() => setStatusFilter(f)}
                >
                  <Text style={[styles.tabText, statusFilter === f && styles.tabTextActive]}>
                    {f.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View>
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
            {user?.role === 'admin' && item.status === 'cerrado' && (
              <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash" size={18} color="white" />
                <Text style={styles.deleteBtnText}>Eliminar (Admin)</Text>
              </Pressable>
            )}
          </View>
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
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: 'white',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  }
});
