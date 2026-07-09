import { lamportClock } from '@onalert/shared';
import { timeSync } from '@onalert/shared';
import {  Coordinates, CreateIncidentInput, Incident, User  } from '@onalert/shared';

export class ReportIncidentUseCase {
  public static async execute(
    user: User,
    input: CreateIncidentInput,
    isOffline: boolean,
    apiGatewayUrl: string,
    jwtToken?: string
  ): Promise<Incident> {

    // 1. Reloj Lógico y Dual Timestamp
    const lamport = lamportClock.increment();
    const { localTimestamp, receiveTimestamp } = timeSync.getDualTimestamps();

    const incident: Incident = {
      id: `inc_${Date.now()}`,
      type: input.type,
      priority: input.isSOS ? 'alta' : 'media',
      status: 'activo',
      title: input.title,
      description: input.description,
      reporterId: user.id,
      reporterName: user.name,
      location: input.location,
      address: input.address ? `${input.address} (${user.community})` : user.community,
      imageUri: input.imageUri,
      createdAt: localTimestamp,
      updatedAt: receiveTimestamp,
      isSOS: input.isSOS || false,
      safetyConfirmations: []
    };

    if (isOffline) {
      console.log('No se puede crear el reporte sin conexión. La nube es requerida.');
      throw new Error('Debes tener conexión a Internet para crear un reporte.');
    } else {
      console.log('📡 Enviando reporte a la Nube...');
      try {
        const response = await fetch(`${apiGatewayUrl}/api/incidents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify({
            type: incident.type,
            title: incident.title,
            description: incident.description,
            location: {
              type: 'Point',
              coordinates: [incident.location.longitude, incident.location.latitude]
            },
            reporter_name: user.name,
            media_urls: incident.imageUri ? [incident.imageUri] : [],
            lamport_timestamp: lamport
          })
        });

        if (!response.ok) {
          throw new Error('El Gateway de red rechazó el reporte');
        }

        const data = await response.json();
        return {
          ...incident,
          id: data._id || incident.id
        };
      } catch (err) {
        console.warn('❌ Falló conexión al enviar reporte. Modo offline desactivado.');
        throw new Error('No se pudo enviar el reporte. Verifica tu conexión.');
      }
    }
  }
}
