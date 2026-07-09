import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChatMessage,
  CreateIncidentInput,
  Incident,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  User,
} from '../types';

const STORAGE_KEYS = {
  user: '@onalert_v2_user',
  incidents: '@onalert_v2_incidents',
  messages: '@onalert_v2_messages',
};

const priorityByType: Record<IncidentType, IncidentPriority> = {
  sos: 'alta',
  robo: 'alta',
  violencia: 'alta',
  incendio: 'alta',
  medica: 'alta',
  sospechoso: 'media',
  accidente: 'media',
};

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createDemoIncidents(): Incident[] {
  const now = Date.now();
  return [
    {
      id: 'inc_demo_1',
      type: 'sospechoso',
      priority: 'media',
      status: 'activo',
      title: 'Persona sospechosa cerca del parque',
      description: 'Se observa a una persona merodeando cerca del parque central.',
      reporterId: 'demo_user',
      reporterName: 'María López',
      location: { latitude: -0.1807, longitude: -78.4678 },
      address: 'Parque La Carolina, Quito',
      createdAt: new Date(now - 3600000).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString(),
      isSOS: false,
      safetyConfirmations: [],
    },
    {
      id: 'inc_demo_2',
      type: 'robo',
      priority: 'alta',
      status: 'validado',
      title: 'Intento de robo en garaje',
      description: 'Vecinos reportaron intento de robo en el estacionamiento.',
      reporterId: 'demo_user2',
      reporterName: 'Carlos Ruiz',
      location: { latitude: -0.1825, longitude: -78.4695 },
      address: 'Urbanización La Colmena',
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 82800000).toISOString(),
      isSOS: false,
      safetyConfirmations: [],
    },
  ];
}

export async function loadUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  return raw ? JSON.parse(raw) : null;
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.user);
}

export async function loadIncidents(): Promise<Incident[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.incidents);
  if (!raw) {
    const demo = createDemoIncidents();
    await AsyncStorage.setItem(STORAGE_KEYS.incidents, JSON.stringify(demo));
    return demo;
  }
  return JSON.parse(raw);
}

export async function saveIncidents(incidents: Incident[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.incidents, JSON.stringify(incidents));
}

export async function loadMessages(): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.messages);
  return raw ? JSON.parse(raw) : [];
}

export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
}

export function buildIncident(
  input: CreateIncidentInput,
  user: User,
): Incident {
  const now = new Date().toISOString();
  const isSOS = input.isSOS ?? input.type === 'sos';

  return {
    id: generateId('inc'),
    type: input.type,
    priority: isSOS ? 'alta' : priorityByType[input.type],
    status: 'activo',
    title: input.title,
    description: input.description,
    reporterId: user.id,
    reporterName: user.name,
    location: input.location,
    address: input.address,
    imageUri: input.imageUri,
    createdAt: now,
    updatedAt: now,
    isSOS,
    safetyConfirmations: [],
  };
}

export function getPriorityForType(type: IncidentType, isSOS = false): IncidentPriority {
  if (isSOS) return 'alta';
  return priorityByType[type];
}

export function canManageIncidents(role: User['role']): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'policia_upc';
}

export function updateIncidentStatus(
  incidents: Incident[],
  incidentId: string,
  status: IncidentStatus,
): Incident[] {
  return incidents.map((inc) =>
    inc.id === incidentId
      ? { ...inc, status, updatedAt: new Date().toISOString() }
      : inc,
  );
}

export function addSafetyConfirmation(
  incidents: Incident[],
  incidentId: string,
  user: User,
): Incident[] {
  return incidents.map((inc) => {
    if (inc.id !== incidentId) return inc;
    if (inc.safetyConfirmations.some((c) => c.userId === user.id)) return inc;
    return {
      ...inc,
      safetyConfirmations: [
        ...inc.safetyConfirmations,
        {
          userId: user.id,
          userName: user.name,
          confirmedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  });
}

export function addChatMessage(
  messages: ChatMessage[],
  incidentId: string,
  user: User,
  text: string,
): ChatMessage[] {
  const message: ChatMessage = {
    id: generateId('msg'),
    incidentId,
    userId: user.id,
    userName: user.name,
    text,
    createdAt: new Date().toISOString(),
  };
  return [...messages, message];
}

export function getIncidentMessages(
  messages: ChatMessage[],
  incidentId: string,
): ChatMessage[] {
  return messages
    .filter((m) => m.incidentId === incidentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
