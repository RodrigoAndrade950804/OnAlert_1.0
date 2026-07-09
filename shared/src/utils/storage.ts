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
  token: '@onalert_v2_token',
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

export async function loadUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  return raw ? JSON.parse(raw) : null;
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.user);
  await AsyncStorage.removeItem(STORAGE_KEYS.token);
}

export async function loadToken(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.token);
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.token, token);
}

export async function loadMessages(): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.messages);
  return raw ? JSON.parse(raw) : [];
}

export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
}

export async function clearOfflineCache(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.incidents);
  await AsyncStorage.removeItem(STORAGE_KEYS.messages);
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
      status: inc.reporterId === user.id ? 'cerrado' : inc.status,
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
