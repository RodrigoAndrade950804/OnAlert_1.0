import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { 
  ChatMessage,
  Coordinates,
  CreateIncidentInput,
  Incident,
  IncidentStatus,
  User,
 } from '@onalert/shared';
import {
  addChatMessage,
  addSafetyConfirmation,
  clearUser,
  loadIncidents,
  loadMessages,
  loadUser,
  saveIncidents,
  saveMessages,
  saveUser,
  updateIncidentStatus,
} from '@onalert/shared';
import { lamportClock } from '@onalert/shared';
import { p2pNode } from '@/src/infrastructure/services/p2pNode';
import { timeSync } from '@onalert/shared';
import { ActivateEmergencyButtonUseCase } from '@/src/application/usecases/ActivateEmergencyButtonUseCase';
import { ReportIncidentUseCase } from '@/src/application/usecases/ReportIncidentUseCase';
import { SyncOfflineDataUseCase } from '@/src/application/usecases/SyncOfflineDataUseCase';
import { getApiGatewayUrl } from '@onalert/shared';
import { watchLocation } from '@onalert/shared';
import { AuthService } from '@/src/infrastructure/services/AuthService';

const API_GATEWAY_URL = getApiGatewayUrl();

interface AlertContextValue {
  user: User | null;
  incidents: Incident[];
  messages: ChatMessage[];
  userLocation: Coordinates | null;
  isLoading: boolean;
  isOffline: boolean;
  jwtToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleOfflineMode: () => void;
  setUserLocation: (location: Coordinates | null) => void;
  createIncident: (input: CreateIncidentInput) => Promise<Incident>;
  sendSOS: (location: Coordinates, address?: string) => Promise<Incident>;
  confirmSafety: (incidentId: string) => Promise<void>;
  sendMessage: (incidentId: string, text: string) => Promise<void>;
  updateStatus: (incidentId: string, status: IncidentStatus) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Suscripción al GPS en tiempo real para rastreo continuo (Pág. 14 del PDF)
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const startWatching = async () => {
      const sub = await watchLocation((coords) => {
        setUserLocation(coords);
      });
      if (sub) {
        subscription = sub;
      } else {
        // Fallback robusto a ubicación simulada (ej. Quito Central) si el GPS es denegado (muy común en Web)
        console.warn('Usando ubicación simulada porque el GPS no está disponible.');
        setUserLocation({ latitude: -0.1807, longitude: -78.4678 });
      }
    };

    startWatching();

    return () => {
      if (subscription) {
        try {
          subscription.remove();
          console.log('📡 GPS Track: Suscripción de ubicación removida.');
        } catch (err) {
          console.warn('⚠️ No se pudo remover la suscripción de GPS en la Web:', err);
        }
      }
    };
  }, []);
  
  // Variables del estado distribuido
  const [isOffline, setIsOffline] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    // Si estamos online, intentar obtener incidentes del servidor
    if (!isOffline && jwtToken) {
      try {
        const url = `${API_GATEWAY_URL}/api/incidents`;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });
        if (response.ok) {
          const cloudIncidents = await response.json();
          // Mapear de MongoDB a la interfaz local
          const mapped = cloudIncidents.map((inc: any) => ({
            id: inc._id,
            type: inc.type,
            priority: inc.severity,
            status: inc.status,
            title: inc.title,
            description: inc.description || '',
            reporterId: inc.reporter_id,
            reporterName: inc.reporter_name,
            location: {
              latitude: inc.location.coordinates[1],
              longitude: inc.location.coordinates[0]
            },
            createdAt: inc.createdAt,
            updatedAt: inc.updatedAt,
            isSOS: inc.type === 'sos',
            safetyConfirmations: inc.safetyConfirmations || []
          }));
          setIncidents(mapped);
          await saveIncidents(mapped);
          return;
        }
      } catch (err) {
        console.warn('⚠️ Falló al conectar con la Nube para refrescar datos. Usando caché local.');
      }
    }

    // Fallback a localStorage local
    const [storedUser, storedIncidents, storedMessages] = await Promise.all([
      loadUser(),
      loadIncidents(),
      loadMessages(),
    ]);
    setUser(storedUser);
    setIncidents(storedIncidents);
    setMessages(storedMessages);
  }, [isOffline, jwtToken]);

  // Inicializar P2P Node cuando el usuario ingresa
  useEffect(() => {
    if (user) {
      p2pNode.initialize(user.id, user.role, user.community);
      p2pNode.setOfflineMode(isOffline);
    }
  }, [user, isOffline]);

  useEffect(() => {
    refreshData().finally(() => setIsLoading(false));
  }, [refreshData]);

  // WebSockets (Socket.io) para Notificaciones en Tiempo Real (HU-13)
  useEffect(() => {
    let socket: any = null;
    
    if (!isOffline && jwtToken) {
      // Importación dinámica de socket.io-client
      const io = require('socket.io-client').io;
      
      socket = io(API_GATEWAY_URL, {
        auth: { token: jwtToken },
        transports: ['websocket', 'polling'] // Try WS first, fallback to polling
      });

      socket.on('connect', () => {
        console.log('⚡ Conectado al Gateway WebSockets');
        // Sincronizar datos atrasados apenas conectamos
        SyncOfflineDataUseCase.execute(API_GATEWAY_URL, jwtToken).then(() => {
          refreshData();
        });
      });

      socket.on('new_incident_event', (event: any) => {
        console.log('🚨 NOTIFICACIÓN PUSH RECIBIDA:', event);
        // Cuando llega un evento (como incident.created), refrescamos los datos instantáneamente
        refreshData();
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Desconectado del Gateway WebSockets');
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isOffline, jwtToken, refreshData]);

  const toggleOfflineMode = useCallback(() => {
    setIsOffline(prev => !prev);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: authUser, token, isOffline: offlineState } = await AuthService.login(email, password);
      setUser(authUser);
      setJwtToken(token);
      setIsOffline(offlineState);
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearUser();
    setUser(null);
    setJwtToken(null);
  }, []);

  // Enviar reporte de incidente normal (HU-02)
  const createIncident = useCallback(
    async (input: CreateIncidentInput) => {
      if (!user) throw new Error('Usuario no autenticado');
      
      const newIncident = await ReportIncidentUseCase.execute(
        user,
        input,
        isOffline,
        API_GATEWAY_URL,
        jwtToken || undefined
      );

      // Actualizar UI
      setIncidents(prev => {
        const updated = [newIncident, ...prev];
        saveIncidents(updated).catch(console.error);
        return updated;
      });
      return newIncident;
    },
    [user, isOffline, jwtToken],
  );

  // Activación del botón crítico SOS (HU-01)
  const sendSOS = useCallback(
    async (location: Coordinates, address?: string) => {
      if (!user) throw new Error('Usuario no autenticado');

      const sosIncident = await ActivateEmergencyButtonUseCase.execute(
        user,
        location,
        address || 'Dirección SOS',
        isOffline,
        API_GATEWAY_URL,
        jwtToken || undefined
      );

      setIncidents(prev => {
        const updated = [sosIncident, ...prev];
        saveIncidents(updated).catch(console.error);
        return updated;
      });
      return sosIncident;
    },
    [user, isOffline, jwtToken],
  );

  // Confirmación de Seguridad (HU-06)
  const confirmSafety = useCallback(
    async (incidentId: string) => {
      if (!user) return;

      if (!isOffline && jwtToken) {
        try {
          await fetch(`${API_GATEWAY_URL}/api/incidents/${incidentId}/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ userName: user.name })
          });
        } catch (err) {
          console.warn('⚠️ Falló al enviar confirmación a la nube. Guardando local.');
        }
      }

      // Sincronizar en UI local
      const updated = addSafetyConfirmation(incidents, incidentId, user);
      await saveIncidents(updated);
      setIncidents(updated);
    },
    [user, incidents, isOffline, jwtToken],
  );

  const sendMessage = useCallback(
    async (incidentId: string, text: string) => {
      if (!user || !text.trim()) return;
      const updated = addChatMessage(messages, incidentId, user, text.trim());
      await saveMessages(updated);
      setMessages(updated);
    },
    [user, messages],
  );

  const updateStatus = useCallback(
    async (incidentId: string, status: IncidentStatus) => {
      if (!isOffline && jwtToken) {
        try {
          await fetch(`${API_GATEWAY_URL}/api/incidents/${incidentId}/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ status })
          });
        } catch (err) {
          console.warn('⚠️ Falló al validar en la nube.');
        }
      }

      const updated = updateIncidentStatus(incidents, incidentId, status);
      await saveIncidents(updated);
      setIncidents(updated);
    },
    [incidents, isOffline, jwtToken],
  );

  const value = useMemo(
    () => ({
      user,
      incidents,
      messages,
      userLocation,
      isLoading,
      isOffline,
      jwtToken,
      login,
      logout,
      toggleOfflineMode,
      setUserLocation,
      createIncident,
      sendSOS,
      confirmSafety,
      sendMessage,
      updateStatus,
      refreshData,
    }),
    [
      user,
      incidents,
      messages,
      userLocation,
      isLoading,
      isOffline,
      jwtToken,
      login,
      logout,
      toggleOfflineMode,
      createIncident,
      sendSOS,
      confirmSafety,
      sendMessage,
      updateStatus,
      refreshData,
    ],
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts debe usarse dentro de AlertProvider');
  return ctx;
}
