import { lamportClock } from '../../utils/lamportClock';
import { timeSync } from '../../utils/timeSync';
import { p2pNode } from '../../services/p2pNode';
import { Coordinates, Incident, User } from '../../types';

export class ActivateEmergencyButtonUseCase {
  public static async execute(
    user: User,
    location: Coordinates,
    address: string,
    isOffline: boolean,
    apiGatewayUrl: string,
    jwtToken?: string
  ): Promise<Incident> {
    
    // 1. Incrementar Reloj Lógico de Lamport (Pág. 37-38 del PDF)
    const lamport = lamportClock.increment();

    // 2. Generar Marcas de Tiempo Duales (NTP UTC, Pág. 38 del PDF)
    const { localTimestamp, receiveTimestamp } = timeSync.getDualTimestamps();

    // 3. Construir paquete del Incidente SOS
    const incident: Incident = {
      id: `inc_sos_${Date.now()}`,
      type: 'sos',
      priority: 'alta',
      status: 'activo',
      title: '¡ALERTA SOS!',
      description: 'Emergencia reportada desde botón de pánico.',
      reporterId: user.id,
      reporterName: user.name,
      location,
      address: address || 'Ubicación Comunitaria',
      createdAt: localTimestamp,
      updatedAt: receiveTimestamp, // Dual Timestamp
      isSOS: true,
      safetyConfirmations: []
    };

    // 4. Decisión de Enrutamiento Híbrido (Cloud si hay internet, P2P si no)
    if (isOffline) {
      console.log('⚠️ Red offline: Difundiendo SOS por red de malla local (Mesh)...');
      // Difundir en la red Mesh P2P con TTL de 3 saltos
      p2pNode.broadcast('SOS_ALERT', incident, 3);
      return incident;
    } else {
      console.log('🌐 Red online: Enviando SOS al Gateway de la Nube...');
      try {
        const response = await fetch(`${apiGatewayUrl}/api/incidents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            type: 'sos',
            title: incident.title,
            description: incident.description,
            location: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude] // MongoDB GeoJSON
            },
            reporter_name: user.name,
            lamport_timestamp: lamport
          })
        });

        if (!response.ok) {
          throw new Error('Servidor falló al recibir el SOS');
        }

        const data = await response.json();
        return {
          ...incident,
          id: data._id || incident.id
        };
      } catch (err) {
        console.warn('❌ Fallo al conectar a la nube. Cambiando a canal P2P como respaldo.');
        p2pNode.broadcast('SOS_ALERT', incident, 3);
        return incident;
      }
    }
  }
}
