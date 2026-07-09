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
} from '../types';
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
} from '../utils/storage';
import { lamportClock } from '../utils/lamportClock';
import { p2pNode } from '../services/p2pNode';
import { timeSync } from '../utils/timeSync';
import { ActivateEmergencyButtonUseCase } from '../application/usecases/ActivateEmergencyButtonUseCase';
import { ReportIncidentUseCase } from '../application/usecases/ReportIncidentUseCase';
import { SyncOfflineDataUseCase } from '../application/usecases/SyncOfflineDataUseCase';

const API_GATEWAY_URL = 'http://localhost:8000';

interface AlertContextValue {
  user: User | null;
  incidents: Incident[];
  messages: ChatMessage[];
  userLocation: Coordinates | null;
  isLoading: boolean;
  isOffline: boolean;
  jwtToken: string | null;
  login: (name: string, role: User['role'], community: string) => Promise<void>;
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
  
  // Variables del estado distribuido
  const [isOffline, setIsOffline] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    // Si estamos online, intentar obtener incidentes del servidor
    if (!isOffline && jwtToken) {
      try {
        const url = userLocation
          ? `${API_GATEWAY_URL}/api/incidents?longitude=${userLocation.longitude}&latitude=${userLocation.latitude}`
          : `${API_GATEWAY_URL}/api/incidents`;
          
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
  }, [isOffline, jwtToken, userLocation]);

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

  // Sincronización automática cuando el usuario vuelve a estar ONLINE (Sync Strategy)
  useEffect(() => {
    if (!isOffline && jwtToken) {
      SyncOfflineDataUseCase.execute(API_GATEWAY_URL, jwtToken).then(() => {
        refreshData();
      });
    }
  }, [isOffline, jwtToken, refreshData]);

  const toggleOfflineMode = useCallback(() => {
    setIsOffline(prev => !prev);
  }, []);

  const login = useCallback(
    async (name: string, role: User['role'], community: string) => {
      const email = `${name.toLowerCase().replace(/\s+/g, '')}@onalert.com`;
      
      try {
        console.log('🌐 Intentando login en servidor central...');
        // 1. Intentar registrarse primero por si es nuevo (Simulación de Auto-Registro)
        await fetch(`${API_GATEWAY_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'password123', name, role, communityName: community })
        });

        // 2. Autenticar en el Gateway
        const loginRes = await fetch(`${API_GATEWAY_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'password123' })
        });

        if (loginRes.ok) {
          const authData = await loginRes.json();
          setJwtToken(authData.token);
          
          const authenticatedUser: User = {
            id: authData.user.id,
            name: authData.user.name,
            role: authData.user.role.toLowerCase(),
            community: authData.user.community
          };

          await saveUser(authenticatedUser);
          setUser(authenticatedUser);
          console.log('✅ Login exitoso en la nube. Token JWT guardado.');
          return;
        }
      } catch (err) {
        console.warn('⚠️ No se pudo conectar al API Gateway. Iniciando en modo local/offline.');
      }

      // Fallback local en modo offline
      const localUser: User = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        role,
        community: community.trim() || 'La Colmena',
      };
      await saveUser(localUser);
      setUser(localUser);
      setIsOffline(true); // Forzar modo offline si no hay red
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
      setIncidents(prev => [newIncident, ...prev]);
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

      setIncidents(prev => [sosIncident, ...prev]);
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
