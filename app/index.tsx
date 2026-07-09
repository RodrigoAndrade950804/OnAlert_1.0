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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../context/AlertContext';
import { colors } from '../constants/theme';
import { UserRole } from '../types';

const roles: { value: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'vecino', label: 'Vecino', icon: 'home' },
  { value: 'guardia', label: 'Guardia', icon: 'shield' },
  { value: 'admin', label: 'Administrador', icon: 'settings' },
];

export default function LoginScreen() {
  const { user, login } = useAlerts();
  const router = useRouter();
  const [name, setName] = useState('');
  const [community, setCommunity] = useState('La Colmena');
  const [role, setRole] = useState<UserRole>('vecino');

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!name.trim()) return;
    await login(name, role, community);
    router.replace('/(tabs)');
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
            Seguridad comunitaria en tiempo real
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Tu nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Sergio Masín"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Comunidad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: La Colmena"
            value={community}
            onChangeText={setCommunity}
          />

          <Text style={styles.label}>Rol</Text>
          <View style={styles.roleRow}>
            {roles.map((item) => (
              <Pressable
                key={item.value}
                style={[styles.roleChip, role === item.value && styles.roleChipActive]}
                onPress={() => setRole(item.value)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={role === item.value ? '#fff' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.roleChipText,
                    role === item.value && styles.roleChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>Entrar a la comunidad</Text>
          </Pressable>

          <Text style={styles.note}>
            Prototipo funcional · Los datos se guardan localmente en tu dispositivo
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
