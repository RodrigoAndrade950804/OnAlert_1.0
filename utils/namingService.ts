import { User } from '../types';

class NamingService {
  private localRegistry: Map<string, string> = new Map(); // Mapea ruta lógica -> dirección física (IP/Socket ID)

  // Genera rutas lógicas estructuradas jerárquicamente tipo DNS (Pág. 33 del PDF)
  public buildLogicalPath(
    community: string,
    type: 'usuarios' | 'incidentes' | 'chats' | 'superpeer',
    resourceId: string
  ): string {
    const cleanCommunity = community.toLowerCase().replace(/\s+/g, '_');
    const cleanResource = resourceId.toLowerCase().replace(/\s+/g, '_');
    return `/onalert/quito/${cleanCommunity}/${type}/${cleanResource}`;
  }

  // Simulación de Consistencia y Hashing DHT (Chord DHT modulo n, Pág. 32 del PDF)
  // Determina qué Super Peer de la red (anillo de hashes) debe almacenar/resolver este recurso
  public hashToSuperPeer(logicalPath: string, superPeers: string[]): string {
    if (superPeers.length === 0) return 'central_gateway';
    
    // Algoritmo de Hashing simple (djb2) para obtener un número entero consistente
    let hash = 5381;
    for (let i = 0; i < logicalPath.length; i++) {
      hash = ((hash << 5) + hash) + logicalPath.charCodeAt(i);
    }
    
    // Consistent Hashing: Asigna el recurso al Super Peer más cercano en el anillo de hashes
    const index = Math.abs(hash) % superPeers.length;
    return superPeers[index];
  }

  public register(logicalPath: string, ipAddress: string): void {
    this.localRegistry.set(logicalPath, ipAddress);
    console.log(`📡 Naming Service: Registrado [${logicalPath}] -> [${ipAddress}]`);
  }

  public resolve(logicalPath: string): string | null {
    const address = this.localRegistry.get(logicalPath);
    console.log(`🔍 Naming Service: Resolviendo [${logicalPath}] -> ${address ? `[${address}]` : 'Ruta no encontrada localmente'}`);
    return address || null;
  }
}

export const namingService = new NamingService();
