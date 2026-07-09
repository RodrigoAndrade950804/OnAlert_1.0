import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function getApiGatewayUrl(): string {
  // En Web, localhost es correcto y evita problemas de CORS si se accede localmente.
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  
  // Obtener la IP del servidor de desarrollo de Metro de forma dinámica
  // Esto hace que funcione automáticamente en celular físico y en emuladores
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.tool;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000`;
  }
  
  // Fallback clásico
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
}
