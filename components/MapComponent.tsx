import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAlerts } from '../context/AlertContext';
import { colors, incidentTypeLabels } from '../constants/theme';
import { IncidentType } from '../types';
import { Ionicons } from '@expo/vector-icons';

const filters: (IncidentType | 'todos')[] = [
  'todos',
  'sos',
  'robo',
  'sospechoso',
  'incendio',
  'medica',
];

const markerColors: Record<string, string> = {
  alta: colors.alta,
  media: colors.media,
  baja: colors.baja,
};

export default function MapComponent() {
  const router = useRouter();
  const { incidents } = useAlerts();
  const [filter, setFilter] = useState<IncidentType | 'todos'>('todos');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const visibleIncidents = useMemo(() => {
    return incidents.filter((i) =>
      filter === 'todos' ? true : i.type === filter,
    );
  }, [incidents, filter]);

  return (
    <View style={styles.container}>
      <View style={styles.mapMock}>
        <View style={styles.gridOverlay}>
          <View style={styles.roadHorizontal} />
          <View style={[styles.roadHorizontal, { top: '60%' }]} />
          <View style={styles.roadVertical} />
          <View style={[styles.roadVertical, { left: '70%' }]} />
          
          <View style={styles.parkArea}>
            <Ionicons name="leaf" size={24} color="#10B981" />
            <Text style={styles.parkText}>Parque Central</Text>
          </View>
        </View>

        {visibleIncidents.map((incident) => {
          const leftPercent = 15 + ((incident.location.longitude * 1000) % 70);
          const topPercent = 20 + ((incident.location.latitude * 1000) % 60);

          return (
            <Pressable
              key={incident.id}
              style={[
                styles.markerPin,
                { left: `${Math.abs(leftPercent)}%`, top: `${Math.abs(topPercent)}%` }
              ]}
              onPress={() => setSelectedIncident(incident)}
            >
              <View style={[styles.pinCircle, { backgroundColor: markerColors[incident.priority] }]}>
                <Ionicons 
                  name={incident.type === 'sos' ? 'alert-circle' : 'warning'} 
                  size={14} 
                  color="#fff" 
                />
              </View>
              <View style={styles.pulseRing} />
            </Pressable>
          );
        })}

        {selectedIncident && (
          <View style={styles.calloutCard}>
            <View style={styles.calloutHeader}>
              <Text style={styles.calloutTitle}>{selectedIncident.title}</Text>
              <Pressable onPress={() => setSelectedIncident(null)}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.calloutType}>
              Tipo: {incidentTypeLabels[selectedIncident.type]}
            </Text>
            <Text style={styles.calloutDesc} numberOfLines={2}>
              {selectedIncident.description || 'Sin descripción adicional.'}
            </Text>
            <Pressable 
              style={styles.calloutButton}
              onPress={() => router.push(`/incident/${selectedIncident.id}`)}
            >
              <Text style={styles.calloutButtonText}>Ver detalle completo →</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.filterBar}>
        {filters.map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, filter === item && styles.chipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
              {item === 'todos' ? 'Todos' : incidentTypeLabels[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.webNote}>
        <Ionicons name="information-circle" size={16} color="#fff" />
        <Text style={styles.webNoteText}>
          Modo Web: Visualizando simulación de mapa interactivo para depuración.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  mapMock: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  roadHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '30%',
    height: 40,
    backgroundColor: '#334155',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#475569',
  },
  roadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '25%',
    width: 40,
    backgroundColor: '#334155',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#475569',
  },
  parkArea: {
    position: 'absolute',
    right: '10%',
    top: '10%',
    width: '30%',
    height: '25%',
    backgroundColor: '#064E3B',
    borderColor: '#047857',
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  parkText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  markerPin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
    opacity: 0.4,
    zIndex: 1,
  },
  filterBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    zIndex: 20,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  calloutCard: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 30,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calloutTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: '#fff',
  },
  calloutType: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  calloutButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  webNote: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  webNoteText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
