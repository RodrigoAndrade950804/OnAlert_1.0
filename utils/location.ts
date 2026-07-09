import * as Location from 'expo-location';
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

export async function getCurrentLocation(): Promise<Coordinates | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  try {
    const location = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      LOCATION_TIMEOUT_MS,
      'No se pudo obtener la ubicación a tiempo',
    );

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.warn('getCurrentLocation failed:', error);
    return null;
  }
}

export async function getAddressFromCoords(coords: Coordinates): Promise<string> {
  try {
    const results = await withTimeout(
      Location.reverseGeocodeAsync(coords),
      GEOCODE_TIMEOUT_MS,
      'Geocoding timeout',
    );
    if (results.length === 0) return 'Ubicación no disponible';
    const place = results[0];
    const parts = [place.street, place.district, place.city].filter(Boolean);
    return parts.join(', ') || 'Ubicación no disponible';
  } catch {
    return 'Ubicación no disponible';
  }
}