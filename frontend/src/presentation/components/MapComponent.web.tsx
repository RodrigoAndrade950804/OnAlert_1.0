import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAlerts } from '@/src/application/context/AlertContext';
import { colors, incidentTypeLabels, IncidentType } from '@onalert/shared';
import { Ionicons } from '@expo/vector-icons';

// Importaciones ES6 directas (Soportadas nativamente en Expo Web SPA)
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Arreglo para los íconos rotos por defecto de Leaflet en empaquetadores web
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const CenterMapButton = ({ center, trigger }: { center: [number, number], trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.flyTo(center, 15);
    }
  }, [center, map, trigger]);
  return null;
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
  const { incidents, userLocation, user } = useAlerts();
  const [filter, setFilter] = useState<IncidentType | 'todos'>('todos');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [triggerCenter, setTriggerCenter] = useState(0);

  // Inyectar CSS de Leaflet de forma segura en Web
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  const visibleIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (user?.community !== 'Global' && i.address && !i.address.includes(user?.community || '')) {
        return false;
      }
      if (i.status === 'cerrado') {
        return false;
      }
      return filter === 'todos' ? true : i.type === filter;
    });
  }, [incidents, filter, user]);

  const defaultCenter = [-0.1642512, -78.4958493];
  const centerPosition: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : [defaultCenter[0], defaultCenter[1]];

  const handleCenter = () => {
    setTriggerCenter(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapMock}>
        <MapContainer 
          center={centerPosition} 
          zoom={15} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]}>
              <Popup>
                <div style={{fontWeight: 'bold', color: colors.primary}}>Tú estás aquí</div>
              </Popup>
            </Marker>
          )}

          {visibleIncidents.map((incident, index) => {
            if (!incident.location) return null;
            
            // Offset visual milimétrico para evitar que pines idénticos se sobrepongan por completo
            const offsetLat = (index % 5) * 0.00015;
            const offsetLng = (index % 3) * 0.00015;

            // Leaflet Icon personalizado por prioridad/tipo
            const color = incident.priority === 'alta' ? '#EF4444' : incident.priority === 'media' ? '#F59E0B' : '#3B82F6';
            const markerHtml = `
              <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <div style="width: 8px; height: 8px; background-color: white; border-radius: 4px;"></div>
              </div>
            `;
            
            const customIcon = L.divIcon({
              html: markerHtml,
              className: 'custom-leaflet-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12]
            });

            return (
              <Marker 
                key={incident.id}
                position={[incident.location.latitude + offsetLat, incident.location.longitude + offsetLng]}
                icon={customIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedIncident(incident);
                  },
                }}
              >
                <Popup>
                  <div style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '4px'}}>{incident.title}</div>
                  <div style={{fontSize: '12px', color: '#666'}}>{incident.description}</div>
                </Popup>
              </Marker>
            );
          })}

          <CenterMapButton center={centerPosition} trigger={triggerCenter} />
        </MapContainer>

        {/* Botón flotante para centrar mapa en Web */}
        <Pressable style={styles.fabLocation} onPress={handleCenter}>
          <Ionicons name="locate" size={24} color="#000" />
        </Pressable>

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
              onPress={() => {
                setSelectedIncident(null);
                router.push(`/incident/${selectedIncident.id}`);
              }}
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
    marginRight: 6,
    marginBottom: 6,
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
  calloutTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  calloutType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calloutCard: {
    position: 'absolute',
    bottom: 30,
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
    bottom: 10,
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
  fabLocation: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 100,
  },
});
