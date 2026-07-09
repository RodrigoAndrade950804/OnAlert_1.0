import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
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
  clearOfflineCache,
  loadMessages,
  loadUser,
  loadToken,
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
  deleteIncident: (incidentId: string) => Promise<void>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<any>(null);

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

  const logout = useCallback(async () => {
    await clearUser();
    setUser(null);
    setJwtToken(null);
  }, []);

  const refreshData = useCallback(async (initialLoad = false) => {
    // 1. Obtener sesión local (solo el token y usuario base)
    const storedUser = await loadUser();
    const storedToken = await loadToken();
    
    if (initialLoad) {
      const storedMessages = await loadMessages();
      setMessages(storedMessages);
    }
    
    // Si no hay token en el estado, intentamos sacarlo de Storage
    let currentToken = jwtToken || storedToken;
    if (currentToken && currentToken !== jwtToken) {
      setJwtToken(currentToken);
    }

    // Skip validation for superadmin (offline logic)
    if (storedUser && storedUser.role === 'superadmin') {
      setUser(storedUser);
      return;
    }

    if (storedUser && currentToken) {
      // 2. Validar Token contra BDD
      try {
        const urlMe = `${API_GATEWAY_URL}/api/auth/me`;
        const resMe = await fetch(urlMe, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (!resMe.ok) {
          // Si el usuario fue borrado o token expiró, lo sacamos
          await logout();
          return;
        }
        const dataMe = await resMe.json();
        setUser(dataMe.user);
      } catch (err) {
        console.warn('Error validando token, modo offline asumido o backend caído.');
        setUser(storedUser); // Fallback si no hay red
      }
    } else if (storedUser && !currentToken) {
      // Si tenemos usuario pero no token (y no es offline mock demo), forzamos logout
      if (storedUser.id.startsWith('demo_')) {
        setUser(storedUser);
      } else {
        await logout();
        return;
      }
    } else {
      setUser(storedUser);
    }

    // 3. Cargar incidentes SOLO DE LA NUBE
    if (!isOffline && currentToken) {
      try {
        const url = `${API_GATEWAY_URL}/api/incidents`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (response.ok) {
          const cloudIncidents = await response.json();
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
        }
      } catch (err) {
        console.warn('Falló al conectar con la Nube para refrescar incidentes.');
        setIncidents([]); // CERO CACHÉ LOCAL
      }
    } else {
      setIncidents([]); // CERO CACHÉ LOCAL EN MODO OFFLINE
    }
  }, [isOffline, jwtToken, logout]);

  // Inicializar P2P Node cuando el usuario ingresa
  useEffect(() => {
    if (user) {
      p2pNode.initialize(user.id, user.role, user.community);
      p2pNode.setOfflineMode(isOffline);
    }
  }, [user, isOffline]);

  useEffect(() => {
    refreshData(true).finally(() => setIsLoading(false));
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

      socket.on('new_chat_message', (msg: ChatMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          const updated = [...prev, msg];
          saveMessages(updated).catch(console.error);
          return updated;
        });
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Desconectado del Gateway WebSockets');
      });
      
      socketRef.current = socket;
    }

    return () => {
      if (socket) socket.disconnect();
      socketRef.current = null;
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
      setIncidents(updated);
    },
    [user, incidents, isOffline, jwtToken],
  );

  const sendMessage = useCallback(
    async (incidentId: string, text: string) => {
      if (!user || !text.trim()) return;
      
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        incidentId,
        userId: user.id,
        userName: user.name,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => {
        const updated = [...prev, newMessage];
        saveMessages(updated).catch(console.error);
        return updated;
      });

      // Emitir mensaje por WebSockets en tiempo real
      if (socketRef.current) {
        socketRef.current.emit('send_chat_message', newMessage);
      }
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
      setIncidents(updated);
    },
    [incidents, isOffline, jwtToken],
  );

  const deleteIncident = useCallback(
    async (incidentId: string) => {
      if (!isOffline && jwtToken) {
        try {
          await fetch(`${API_GATEWAY_URL}/api/incidents/${incidentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${jwtToken}`
            }
          });
        } catch (err) {
          console.warn('⚠️ Falló al eliminar en la nube.');
        }
      }

      // Eliminar de caché local
      setIncidents((prev) => {
        const updated = prev.filter(i => i.id !== incidentId);
        return updated;
      });
    },
    [isOffline, jwtToken],
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
      deleteIncident,
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
      deleteIncident,
    ],
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts debe usarse dentro de AlertProvider');
  return ctx;
}
