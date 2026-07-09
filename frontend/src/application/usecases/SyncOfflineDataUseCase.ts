import { loadIncidents, saveIncidents } from '@onalert/shared';
import {  Incident  } from '@onalert/shared';

export class SyncOfflineDataUseCase {
  public static async execute(
    apiGatewayUrl: string,
    jwtToken: string
  ): Promise<{ syncedCount: number; errorsCount: number }> {
    console.log('🔄 Iniciando sincronización de datos locales acumulados (Pág. 15 del PDF)...');
    
    const localIncidents = await loadIncidents();
    // Filtramos incidentes temporales locales creados offline
    const offlineIncidents = localIncidents.filter(inc => inc.id.startsWith('inc_sos_') || inc.id.startsWith('inc_'));

    if (offlineIncidents.length === 0) {
      console.log('✅ No hay incidentes offline pendientes de sincronizar.');
      return { syncedCount: 0, errorsCount: 0 };
    }

    let syncedCount = 0;
    let errorsCount = 0;
    const remainingLocals: Incident[] = [...localIncidents];

    for (const incident of offlineIncidents) {
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
            reporter_name: incident.reporterName,
            media_urls: incident.imageUri ? [incident.imageUri] : [],
            lamport_timestamp: incident.id.startsWith('inc_sos_') ? 1 : 0 // Pasamos marca de Lamport
          })
        });

        if (response.ok) {
          syncedCount++;
          // Remover del arreglo local para no duplicar en el storage
          const idx = remainingLocals.findIndex(inc => inc.id === incident.id);
          if (idx !== -1) {
            remainingLocals.splice(idx, 1);
          }
        } else {
          errorsCount++;
        }
      } catch (err) {
        console.warn(`⚠️ Error al sincronizar incidente ${incident.id}:`, err);
        errorsCount++;
      }
    }

    // Actualizar storage local removiendo los que ya se sincronizaron con la Nube
    await saveIncidents(remainingLocals);
    console.log(`📊 Sincronización finalizada. Éxito: ${syncedCount}, Fallas: ${errorsCount}`);

    return { syncedCount, errorsCount };
  }
}
