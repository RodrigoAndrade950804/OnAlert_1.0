import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useAlerts } from '../context/AlertContext';
import { colors, incidentTypeLabels } from '../constants/theme';
import { IncidentType } from '../types';

const defaultRegion = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const markerColors: Record<string, string> = {
  alta: colors.alta,
  media: colors.media,
  baja: colors.baja,
};

const filters: (IncidentType | 'todos')[] = [
  'todos',
  'sos',
  'robo',
  'sospechoso',
  'incendio',
  'medica',
];

export default function MapComponent() {
  const router = useRouter();
  const { incidents, userLocation } = useAlerts();
  const [filter, setFilter] = useState<IncidentType | 'todos'>('todos');

  const visibleIncidents = useMemo(() => {
    return incidents.filter((i) =>
      filter === 'todos' ? true : i.type === filter,
    );
  }, [incidents, filter]);

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : defaultRegion;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {visibleIncidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={incident.location}
            pinColor={markerColors[incident.priority]}
          >
            <Callout onPress={() => router.push(`/incident/${incident.id}`)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{incident.title}</Text>
                <Text style={styles.calloutType}>
                  {incidentTypeLabels[incident.type]}
                </Text>
                <Text style={styles.calloutLink}>Ver detalle →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  filterBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  callout: {
    width: 180,
    padding: 4,
  },
  calloutTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  calloutType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calloutLink: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 6,
    fontWeight: '600',
  },
});
