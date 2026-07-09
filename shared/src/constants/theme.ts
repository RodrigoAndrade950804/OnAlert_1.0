export const colors = {
  primary: '#DC2626',
  primaryDark: '#991B1B',
  primaryLight: '#FEE2E2',
  secondary: '#1E293B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  info: '#3B82F6',
  error: '#EF4444',
  // Colores de severidad
  alta: '#EF4444',
  media: '#F59E0B',
  baja: '#16A34A',
};

export const incidentTypeLabels: Record<string, string> = {
  sos: 'SOS Emergencia',
  robo: 'Robo',
  sospechoso: 'Actividad sospechosa',
  incendio: 'Incendio',
  medica: 'Emergencia médica',
  violencia: 'Violencia',
  accidente: 'Accidente',
};

export const incidentTypeIcons: Record<string, string> = {
  sos: 'warning',
  robo: 'hand-left',
  sospechoso: 'eye',
  incendio: 'flame',
  medica: 'medkit',
  violencia: 'alert-circle',
  accidente: 'car',
};

export const priorityLabels: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};
