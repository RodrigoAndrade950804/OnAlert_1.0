import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {  colors  } from '@onalert/shared';

interface SOSButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

export function SOSButton({ onPress, disabled }: SOSButtonProps) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePress = async () => {
    if (success) return;

    const executeSOS = async () => {
      setSending(true);
      try {
        await onPress();
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } finally {
        setSending(false);
      }
    };
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Enviar alerta SOS?\nSe notificará a toda la comunidad con tu ubicación actual.');
      if (confirmed) {
        await executeSOS();
      }
    } else {
      Alert.alert(
        '¿Enviar alerta SOS?',
        'Se notificará a toda la comunidad con tu ubicación actual.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar SOS',
            style: 'destructive',
            onPress: executeSOS,
          },
        ],
      );
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (pressed || sending) && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        success && styles.buttonSuccess
      ]}
      onPress={handlePress}
      disabled={disabled || sending || success}
    >
      {sending ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : success ? (
        <>
          <Ionicons name="checkmark-circle" size={48} color="#fff" />
          <Text style={styles.subtitle}>¡ENVIADO!</Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>SOS</Text>
          <Text style={styles.subtitle}>Emergencia</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 6,
    borderColor: '#FCA5A5',
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: colors.primaryDark,
  },
  buttonSuccess: {
    backgroundColor: '#10B981', // Verde esmeralda de Tailwind
    borderColor: '#34D399',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#FEE2E2',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
