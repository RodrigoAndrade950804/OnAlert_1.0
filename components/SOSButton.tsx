import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../constants/theme';

interface SOSButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

export function SOSButton({ onPress, disabled }: SOSButtonProps) {
  const [sending, setSending] = useState(false);

  const handlePress = () => {
    Alert.alert(
      '¿Enviar alerta SOS?',
      'Se notificará a toda la comunidad con tu ubicación actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar SOS',
          style: 'destructive',
          onPress: async () => {
            setSending(true);
            try {
              await onPress();
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (pressed || sending) && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled || sending}
    >
      {sending ? (
        <ActivityIndicator color="#fff" size="large" />
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
