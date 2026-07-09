import { lamportClock } from '@onalert/shared';
import { namingService } from '@onalert/shared';
import { timeSync } from '@onalert/shared';
import {  Incident  } from '@onalert/shared';

interface P2PPacket {
  packetId: string;
  senderId: string;
  type: string;
  data: any;
  lamport: number;
  ttl: number;
  timestamps: { localTimestamp: string; receiveTimestamp: string };
}

class P2PNodeService {
  private nodeId: string = `node_${Math.random().toString(36).slice(2, 7)}`;
  private peers: P2PNodeService[] = []; // Nodos en rango físico (Mesh local)
  private seenPackets: Set<string> = new Set(); // Caché de inundación (Flooding) para evitar bucles
  private isSuperPeer: boolean = false;
  private isOfflineMode: boolean = false;
  
  // Consenso local (Mínimo 3 nodos confirmando reporte, Pág. 8 del PDF)
  private incidentVotes: Map<string, Set<string>> = new Map();

  public initialize(userId: string, role: string, community: string): void {
    this.nodeId = `node_${userId}`;
    this.isSuperPeer = role === 'admin' || role === 'guardia';
    
    // Registrar ruta lógica en el Servicio de Nombres
    const category = this.isSuperPeer ? 'superpeer' : 'usuarios';
    const logicalPath = namingService.buildLogicalPath(community, category, userId);
    namingService.register(logicalPath, `192.168.1.${Math.floor(Math.random() * 254)}`);
  }

  public setOfflineMode(offline: boolean): void {
    this.isOfflineMode = offline;
    console.log(`🌐 Nodo local en modo: ${offline ? '❌ OFFLINE (Red Mesh P2P Activa)' : '🟢 ONLINE (Conexión a la Nube)'}`);
  }

  public connectNeighbor(node: P2PNodeService): void {
    if (!this.peers.includes(node)) {
      this.peers.push(node);
      node.peers.push(this);
      console.log(`🔗 Vecino conectado en la malla: [${this.nodeId}] <-> [${node.nodeId}]`);
    }
  }

  // Algoritmo de Inundación (Flooding) con TTL (Pág. 32 del PDF)
  public broadcast(type: string, data: any, ttl: number = 3): void {
    const packetId = `${this.nodeId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const packet: P2PPacket = {
      packetId,
      senderId: this.nodeId,
      type,
      data,
      lamport: lamportClock.increment(),
      ttl,
      timestamps: timeSync.getDualTimestamps()
    };

    console.log(`📡 [${this.nodeId}] Inicia broadcast de '${type}' con TTL: ${ttl}`);
    this.seenPackets.add(packetId);

    // Propagar a todos los vecinos en rango físico
    this.peers.forEach(peer => {
      peer.receive(packet);
    });
  }

  // Procesamiento de paquetes en red Mesh
  public receive(packet: P2PPacket): void {
    // Si ya procesamos esta alerta antes, la ignoramos para evitar tormentas de difusión
    if (this.seenPackets.has(packet.packetId)) return;

    this.seenPackets.add(packet.packetId);

    // Sincronizar Reloj Lógico de Lamport (Pág. 37-38 del PDF)
    const updatedClock = lamportClock.update(packet.lamport);
    console.log(`📥 [${this.nodeId}] Recibió '${packet.type}' de [${packet.senderId}]. Reloj Lamport sincronizado a: ${updatedClock}`);

    // Procesar evento
    if (packet.type === 'SOS_ALERT') {
      console.log(`🚨 [${this.nodeId}] ¡ALERTA SOS LOCAL DETECTADA! Reportero: ${packet.data.reporterName}`);
      this.handleSOSAlert(packet.data);
    } else if (packet.type === 'VOTE_VALIDATION') {
      this.handleVoteValidation(packet.data.incidentId, packet.senderId);
    }

    // Reenviar a vecinos (Inundación) si el TTL lo permite
    if (packet.ttl > 1) {
      const forwardedPacket = {
        ...packet,
        ttl: packet.ttl - 1,
        senderId: this.nodeId
      };
      
      // Enviar de forma paralela simulando sockets no bloqueantes
      setTimeout(() => {
        this.peers.forEach(peer => {
          peer.receive(forwardedPacket);
        });
      }, 50);
    }
  }

  private handleSOSAlert(incident: Incident): void {
    // Si somos Super Peer (Guardia o Administrador), debemos validar el incidente mediante Consenso
    if (this.isSuperPeer) {
      console.log(`🛡️ [${this.nodeId}] Super Peer iniciando Consenso de Validación para Incidente ${incident.id}`);
      this.handleVoteValidation(incident.id, this.nodeId); // Nuestro propio voto
      // Solicitar validación cruzada a otros vecinos (Pág. 31 & 44 del PDF)
      this.broadcast('REQUEST_VALIDATION', { incidentId: incident.id });
    }
  }

  // Algoritmo de Consenso Local (Pág. 8 y 44 del PDF)
  // Requiere la confirmación de al menos 3 nodos antes de marcar como validado
  private handleVoteValidation(incidentId: string, voterId: string): void {
    if (!this.incidentVotes.has(incidentId)) {
      this.incidentVotes.set(incidentId, new Set());
    }

    const votes = this.incidentVotes.get(incidentId)!;
    votes.add(voterId);

    console.log(`🗳️ Consenso [${this.nodeId}]: Incidente ${incidentId} tiene ${votes.size}/3 votos.`);

    if (votes.size >= 3) {
      console.log(`✅ [${this.nodeId}] ¡CONSENSO LOGRADO! Incidente ${incidentId} validado por 3 o más nodos.`);
      // Enviar evento de validación finalizado
      this.broadcast('INCIDENT_VALIDATED', { incidentId, status: 'validado' });
    }
  }

  public getNeighbors(): string[] {
    return this.peers.map(p => p.nodeId);
  }
}

export const p2pNode = new P2PNodeService();
