import React, { useMemo, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAlerts } from '@/src/application/context/AlertContext';
import {  colors, incidentTypeLabels  } from '@onalert/shared';
import {  IncidentType  } from '@onalert/shared';
import { Ionicons } from '@expo/vector-icons';

// =========================================================================
// 🔑 CONFIGURACIÓN DE GOOGLE MAPS
// =========================================================================
// Cambia a `true` solo si tienes una API Key de Google Maps configurada en `app.json`.
// Si es `false`, la app usará un Mapa Simulado vectorial interactivo muy útil
// para pruebas y calificaciones académicas rápidas en emuladores sin configurar APIs.
const USE_REAL_GOOGLE_MAPS = true;
// =========================================================================

let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_DEFAULT: any = null;
let UrlTile: any = null;

if (USE_REAL_GOOGLE_MAPS && Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Callout = Maps.Callout;
    PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
    UrlTile = Maps.UrlTile;
  } catch (e) {
    console.warn('⚠️ No se pudo cargar react-native-maps. Usando mapa simulado.');
  }
}

const defaultRegion = {
  latitude: -0.1807,
  longitude: -78.4678,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const markerColors: Record<string, string> = {
  alta: 'red',
  media: 'orange',
  baja: 'blue',
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
  const mapRef = useRef<any>(null);

  const visibleIncidents = useMemo(() => {
    return incidents.filter((i) => {
      // Filtrar por sector (excepto Global)
      if (user?.community !== 'Global' && i.address && !i.address.includes(user?.community || '')) {
        return false;
      }
      if (i.status === 'cerrado') {
        return false;
      }
      return filter === 'todos' ? true : i.type === filter;
    });
  }, [incidents, filter, user]);

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : defaultRegion;

  const centerMap = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  // RENDERIZAR MAPA REAL DE GOOGLE MAPS
  if (USE_REAL_GOOGLE_MAPS && MapView) {
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {UrlTile && (
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />
          )}

          {visibleIncidents.map((incident, index) => {
            const offsetLat = (index % 5) * 0.00015;
            const offsetLng = (index % 3) * 0.00015;
            
            return (
            <Marker
              key={incident.id}
              coordinate={{
                latitude: incident.location.latitude + offsetLat,
                longitude: incident.location.longitude + offsetLng,
              }}
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
            );
          })}
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

        {/* Botón flotante para centrar mapa */}
        <Pressable style={styles.fabLocation} onPress={centerMap}>
          <Ionicons name="locate" size={24} color="#000" />
        </Pressable>
      </View>
    );
  }

  // RENDERIZAR MAPA SIMULADO DE ALTO RENDIMIENTO (Ideal para pruebas en emuladores)
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

        {/* Marcador del Usuario */}
        {userLocation && (
          <View
            style={[
              styles.markerPin,
              { 
                left: `${Math.abs(15 + ((userLocation.longitude * 1000) % 70))}%`, 
                top: `${Math.abs(20 + ((userLocation.latitude * 1000) % 60))}%`,
                zIndex: 50
              }
            ]}
          >
            <View style={[styles.pinCircle, { backgroundColor: '#3B82F6', width: 20, height: 20, borderRadius: 10 }]}>
              <Ionicons name="person" size={10} color="#fff" />
            </View>
            <View style={[styles.pulseRing, { borderColor: '#3B82F6', width: 30, height: 30, borderRadius: 15 }]} />
            <Text style={{color: '#3B82F6', fontSize: 10, fontWeight: 'bold', position: 'absolute', bottom: -15, width: 100, textAlign: 'center'}}>Tú estás aquí</Text>
          </View>
        )}

        {/* Pines interactivos */}
        {visibleIncidents.map((incident, index) => {
          const offsetLat = (index % 5) * 0.00015;
          const offsetLng = (index % 3) * 0.00015;

          const leftPercent = 15 + (((incident.location.longitude + offsetLng) * 1000) % 70);
          const topPercent = 20 + (((incident.location.latitude + offsetLat) * 1000) % 60);

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

        {/* Detalle modal del marcador */}
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

      <View style={styles.webNote}>
        <Ionicons name="information-circle" size={16} color="#fff" />
        <Text style={styles.webNoteText}>
          Modo Demo: Usando simulación de mapa local (sin requerir Google Maps API Key).
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
  map: {
    flex: 1,
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
  calloutTitleText: {
    fontWeight: '800',
    fontSize: 15,
    color: '#fff',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 50,
  },
});
