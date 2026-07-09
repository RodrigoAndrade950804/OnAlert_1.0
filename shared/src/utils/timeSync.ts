import { Coordinates } from '../types';
import { getApiGatewayUrl } from './api';

class TimeSynchronizer {
  private offsetMs: number = 0;
  private isSync: boolean = false;

  constructor() {
    this.syncWithNetwork();
  }

  // Simulación de NTP (Network Time Protocol) estimando RTT (Round Trip Time)
  public async syncWithNetwork(): Promise<void> {
    try {
      const startTime = Date.now();
      const gatewayUrl = getApiGatewayUrl();
      const response = await fetch(`${gatewayUrl}/health`, { method: 'GET' });
      const endTime = Date.now();
      const rtt = endTime - startTime;
      
      const serverDateHeader = response.headers.get('date');
      if (serverDateHeader) {
        const serverTime = new Date(serverDateHeader).getTime();
        // Calculamos la hora estimada del servidor considerando el retardo RTT / 2
        const estimatedNetworkTime = serverTime + (rtt / 2);
        this.offsetMs = estimatedNetworkTime - endTime;
        this.isSync = true;
        console.log(`⏰ NTP Sincronizado. Offset: ${this.offsetMs}ms, RTT: ${rtt}ms`);
      }
    } catch (err) {
      console.warn('⚠️ Error al sincronizar NTP física. Usando reloj local como fallback.');
      this.offsetMs = 0;
    }
  }

  public getNetworkTime(): Date {
    return new Date(Date.now() + this.offsetMs);
  }

  // Genera las Marcas de Tiempo Duales (Pág. 38 del PDF)
  public getDualTimestamps(): { localTimestamp: string; receiveTimestamp: string } {
    const local = new Date().toISOString();
    const receive = this.getNetworkTime().toISOString();
    return {
      localTimestamp: local,
      receiveTimestamp: receive
    };
  }
}

export const timeSync = new TimeSynchronizer();
