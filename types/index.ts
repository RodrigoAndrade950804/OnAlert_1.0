export type UserRole = 'vecino' | 'admin' | 'guardia';

export type IncidentType =
  | 'sos'
  | 'robo'
  | 'sospechoso'
  | 'incendio'
  | 'medica'
  | 'violencia'
  | 'accidente';

export type IncidentPriority = 'alta' | 'media' | 'baja';

export type IncidentStatus = 'activo' | 'validado' | 'rechazado' | 'cerrado';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  community: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ChatMessage {
  id: string;
  incidentId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface SafetyConfirmation {
  userId: string;
  userName: string;
  confirmedAt: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  title: string;
  description: string;
  reporterId: string;
  reporterName: string;
  location: Coordinates;
  address?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
  isSOS: boolean;
  safetyConfirmations: SafetyConfirmation[];
}

export interface CreateIncidentInput {
  type: IncidentType;
  title: string;
  description: string;
  location: Coordinates;
  address?: string;
  imageUri?: string;
  isSOS?: boolean;
}
