import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PriorityBadge, StatusBadge, TypeIcon } from '@/src/presentation/components/IncidentCard';
import { useAlerts } from '@/src/application/context/AlertContext';
import {  colors, incidentTypeLabels  } from '@onalert/shared';
import { canManageIncidents, getIncidentMessages } from '@onalert/shared';
import { formatDistance, getDistanceKm } from '@onalert/shared';

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incidents, messages, user, userLocation, confirmSafety, sendMessage, updateStatus } =
    useAlerts();
  const [chatText, setChatText] = useState('');

  const incident = incidents.find((i) => i.id === id);
  const incidentMessages = useMemo(
    () => (id ? getIncidentMessages(messages, id) : []),
    [messages, id],
  );

  if (!incident) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Incidente no encontrado</Text>
      </View>
    );
  }

  const distance =
    userLocation && formatDistance(getDistanceKm(userLocation, incident.location));

  const hasConfirmedSafety = incident.safetyConfirmations.some(
    (c) => c.userId === user?.id,
  );

  const isManager = user && canManageIncidents(user.role);

  const handleSendMessage = async () => {
    if (!chatText.trim()) return;
    await sendMessage(incident.id, chatText);
    setChatText('');
  };

  const handleConfirmSafety = async () => {
    await confirmSafety(incident.id);
    Alert.alert('Confirmado', 'Has indicado que estás bien.');
  };

  return (
    <>
      <Stack.Screen options={{ title: incident.isSOS ? 'Alerta SOS' : 'Incidente' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <TypeIcon type={incident.type} size={28} />
              <View style={styles.headerInfo}>
                <Text style={styles.title}>{incident.title}</Text>
                <Text style={styles.meta}>
                  {incidentTypeLabels[incident.type]} · {incident.reporterName}
                </Text>
              </View>
            </View>
            <View style={styles.badges}>
              <PriorityBadge priority={incident.priority} />
              <StatusBadge status={incident.status} />
            </View>
            <Text style={styles.description}>{incident.description}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {new Date(incident.createdAt).toLocaleString('es-EC')}
              </Text>
            </View>
            {incident.address && (
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{incident.address}</Text>
              </View>
            )}
            {distance && (
              <View style={styles.detailRow}>
                <Ionicons name="navigate" size={16} color={colors.info} />
                <Text style={[styles.detailText, { color: colors.info }]}>
                  A {distance} de tu ubicación
                </Text>
              </View>
            )}
          </View>

          {incident.imageUri && (
            <Image source={{ uri: incident.imageUri }} style={styles.evidence} />
          )}

          {incident.status === 'activo' && (
            <Pressable
              style={[styles.safeBtn, hasConfirmedSafety && styles.safeBtnDone]}
              onPress={handleConfirmSafety}
              disabled={hasConfirmedSafety}
            >
              <Ionicons
                name={hasConfirmedSafety ? 'checkmark-circle' : 'heart'}
                size={22}
                color={hasConfirmedSafety ? colors.success : '#fff'}
              />
              <Text
                style={[
                  styles.safeBtnText,
                  hasConfirmedSafety && { color: colors.success },
                ]}
              >
                {hasConfirmedSafety ? 'Ya confirmaste que estás bien' : 'Estoy bien'}
              </Text>
            </Pressable>
          )}

          {incident.safetyConfirmations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Confirmaciones de seguridad ({incident.safetyConfirmations.length})
              </Text>
              {incident.safetyConfirmations.map((c) => (
                <Text key={c.userId} style={styles.confirmItem}>
                  ✓ {c.userName} — {new Date(c.confirmedAt).toLocaleTimeString('es-EC')}
                </Text>
              ))}
            </View>
          )}

          {isManager && incident.status === 'activo' && (
            <View style={styles.adminActions}>
              <Pressable
                style={[styles.adminBtn, { backgroundColor: '#DCFCE7' }]}
                onPress={() => updateStatus(incident.id, 'validado')}
              >
                <Text style={[styles.adminBtnText, { color: colors.success }]}>
                  Validar
                </Text>
              </Pressable>
              <Pressable
                style={[styles.adminBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => updateStatus(incident.id, 'rechazado')}
              >
                <Text style={[styles.adminBtnText, { color: colors.textSecondary }]}>
                  Rechazar
                </Text>
              </Pressable>
              <Pressable
                style={[styles.adminBtn, { backgroundColor: '#DBEAFE' }]}
                onPress={() => updateStatus(incident.id, 'cerrado')}
              >
                <Text style={[styles.adminBtnText, { color: colors.info }]}>
                  Cerrar caso
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chat de emergencia</Text>
            {incidentMessages.length === 0 ? (
              <Text style={styles.emptyChat}>
                Sé el primero en compartir información sobre este incidente.
              </Text>
            ) : (
              incidentMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    msg.userId === user?.id && styles.messageOwn,
                  ]}
                >
                  <Text style={styles.messageAuthor}>{msg.userName}</Text>
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.createdAt).toLocaleTimeString('es-EC', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.chatInput}>
          <TextInput
            style={styles.chatField}
            placeholder="Escribe un mensaje..."
            value={chatText}
            onChangeText={setChatText}
          />
          <Pressable style={styles.sendBtn} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  evidence: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
  },
  safeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  safeBtnDone: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: colors.success,
  },
  safeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  confirmItem: {
    fontSize: 13,
    color: colors.success,
    marginBottom: 4,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  adminBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  adminBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  emptyChat: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  message: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageOwn: {
    backgroundColor: colors.primaryLight,
    borderColor: '#FECACA',
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  chatInput: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatField: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
