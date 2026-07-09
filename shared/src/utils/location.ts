import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { Coordinates } from '../types';

const LOCATION_TIMEOUT_MS = 15000;
const GEOCODE_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Obtener ubicación real única
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Permiso de ubicación denegado.');
      return null;
    }

    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (lastKnown && lastKnown.coords) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }

    const location = await withTimeout(
      Location.getCurrentPositionAsync({ 
        accuracy: Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.High 
      }),
      LOCATION_TIMEOUT_MS,
      'Timeout al obtener posición GPS',
    );

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.warn('⚠️ Error al obtener ubicación única:', error);
    return null;
  }
}

// 📡 Suscribirse a cambios de ubicación en tiempo real (GPSProvider, Pág. 14 del PDF)
export async function watchLocation(
  onLocationChange: (coords: Coordinates) => void
): Promise<{ remove: () => void } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Permiso de ubicación denegado para rastreo continuo.');
      return null;
    }

    // Suscripción activa que notifica al mover el emulador o caminar
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,    // Actualizar cada 3 segundos
        distanceInterval: 2,   // O cada 2 metros
      },
      (location) => {
        if (location && location.coords) {
          console.log(`📡 GPS Update: Lat: ${location.coords.latitude}, Lon: ${location.coords.longitude}`);
          onLocationChange({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      }
    );

    return subscription;
  } catch (err) {
    console.error('❌ Error al iniciar el rastreo de ubicación continuo:', err);
    return null;
  }
}

// Resolver dirección real o mostrar coordenadas
export async function getAddressFromCoords(coords: Coordinates): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'OnAlert/1.0' } });
      const data = await res.json();
      return data.display_name || `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`;
    }

    const results = await withTimeout(
      Location.reverseGeocodeAsync(coords),
      GEOCODE_TIMEOUT_MS,
      'Geocoding timeout',
    );
    
    if (results.length === 0) {
      return `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`;
    }
    
    const place = results[0];
    const parts = [place.street, place.district, place.city].filter(Boolean);
    return parts.join(', ') || `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`;
  } catch {
    return `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`;
  }
}