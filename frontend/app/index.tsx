import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '@/src/application/context/AlertContext';
import {  colors  } from '@onalert/shared';
import {  UserRole  } from '@onalert/shared';

const roles: { value: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'vecino', label: 'Vecino', icon: 'home' },
  { value: 'guardia', label: 'Guardia', icon: 'shield' },
  { value: 'admin', label: 'Administrador', icon: 'settings' },
];

export default function LoginScreen() {
  const { user, login } = useAlerts();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      if (Platform.OS === 'web') window.alert('Llene todos los campos');
      else Alert.alert('Error', 'Llene todos los campos');
      return;
    }
    
    try {
      await login(email.trim(), password.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e.message || 'Error al iniciar sesión');
      else Alert.alert('Error de Login', e.message || 'Credenciales incorrectas.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>OnAlert</Text>
          <Text style={styles.subtitle}>
            Seguridad comunitaria gestionada
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="usuario@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.button, (!email.trim() || !password.trim()) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!email.trim() || !password.trim()}
          >
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </Pressable>

          <Pressable onPress={() => {
            if (Platform.OS === 'web') {
              window.alert('Restablecimiento Protegido:\nPor seguridad, solo el Líder Comunal (Admin) de tu sector puede restablecer contraseñas o modificar accesos. Acércate a él o a la UPC más cercana.');
            } else {
              Alert.alert(
                'Restablecimiento Protegido',
                'Por seguridad, solo el Líder Comunal (Admin) de tu sector puede restablecer contraseñas o modificar accesos. Acércate a él o a la UPC más cercana.'
              );
            }
          }}>
            <Text style={[styles.note, { color: colors.primary, marginTop: 16, fontWeight: '600' }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <Text style={styles.note}>
            El acceso es gestionado por los líderes de tu sector. Solicita tus credenciales en la UPC o a tu Administrador de Barrio.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleChipTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
