import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function getApiGatewayUrl(): string {
  // 1. Usar variable de entorno si existe (Ideal para Producción / Vercel con ngrok)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. En Web local, localhost es correcto
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  
  // 3. Obtener la IP del servidor de desarrollo de Metro de forma dinámica (Móvil)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.tool;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
  }
  
  // 4. Fallback clásico
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
}
