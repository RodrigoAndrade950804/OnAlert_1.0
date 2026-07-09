import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import {  colors, incidentTypeLabels, priorityLabels  } from '@onalert/shared';
import {  IncidentPriority, IncidentStatus, IncidentType  } from '@onalert/shared';

interface PriorityBadgeProps {
  priority: IncidentPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const color =
    priority === 'alta' ? colors.alta : priority === 'media' ? colors.media : colors.baja;

  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.text, { color }]}>{priorityLabels[priority]}</Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: IncidentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorMap: Record<IncidentStatus, string> = {
    activo: colors.alta,
    en_progreso: colors.media,
    atendido: colors.success,
    validado: colors.success,
    rechazado: colors.textSecondary,
    cerrado: colors.info,
  };

  const labelMap: Record<IncidentStatus, string> = {
    activo: 'Activo',
    en_progreso: 'En Progreso',
    atendido: 'Atendido',
    validado: 'Validado',
    rechazado: 'Rechazado',
    cerrado: 'Cerrado',
  };

  return (
    <View style={[styles.badge, { backgroundColor: `${colorMap[status]}20` }]}>
      <Text style={[styles.text, { color: colorMap[status] }]}>{labelMap[status]}</Text>
    </View>
  );
}

interface TypeIconProps {
  type: IncidentType;
  size?: number;
}

export function TypeIcon({ type, size = 20 }: TypeIconProps) {
  const iconName = {
    sos: 'warning',
    robo: 'hand-left',
    sospechoso: 'eye',
    incendio: 'flame',
    medica: 'medkit',
    violencia: 'alert-circle',
    accidente: 'car',
  }[type] as keyof typeof Ionicons.glyphMap;

  return <Ionicons name={iconName} size={size} color={colors.primary} />;
}

interface IncidentCardProps {
  title: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  description: string;
  distance?: string;
  time: string;
  reporterName: string;
  address?: string;
  onPress?: () => void;
}

export function IncidentCard({
  title,
  type,
  priority,
  status,
  description,
  distance,
  time,
  reporterName,
  address,
}: IncidentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <TypeIcon type={type} size={22} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cardMeta}>
            {incidentTypeLabels[type]} · {reporterName}
          </Text>
          {address && (
            <Text style={[styles.cardMeta, { color: colors.primary, fontWeight: '600' }]} numberOfLines={1}>
              📍 {address}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {description}
      </Text>
      <View style={styles.cardFooter}>
        <PriorityBadge priority={priority} />
        <StatusBadge status={status} />
        {distance ? <Text style={styles.distance}>{distance}</Text> : null}
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  distance: {
    fontSize: 12,
    color: colors.info,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
});
