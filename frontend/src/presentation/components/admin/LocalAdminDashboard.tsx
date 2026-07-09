import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {  colors  } from '@onalert/shared';
import {  User, UserRole  } from '@onalert/shared';
import { UserService } from '@/src/infrastructure/services/UserService';
import { useAlerts } from '@/src/application/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';

export function LocalAdminDashboard() {
  const { user } = useAlerts();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('vecino');
  const [users, setUsers] = useState<User[]>([]);

  const community = user?.community || 'Desconocida';

  const roles: { value: UserRole; label: string }[] = [
    { value: 'vecino', label: 'Vecino' },
    { value: 'policia_upc', label: 'Policía UPC' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await UserService.getUsersByCommunity(community);
    // Filtrar para no mostrarse a sí mismo
    setUsers(allUsers.filter(u => u.id !== user?.id && u.role !== 'admin'));
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      if (Platform.OS === 'web') window.alert('Llena todos los campos');
      else Alert.alert('Error', 'Llena todos los campos');
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let isOffline = false;
    let finalId = `user_${Date.now()}`;

    try {
      const { getApiGatewayUrl } = require('@onalert/shared');
      const API_URL = getApiGatewayUrl();
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password.trim(),
          name: name.trim(),
          role: role,
          communityName: community
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (Platform.OS === 'web') window.alert(errorData.error);
        else Alert.alert('Error', errorData.error);
        return; // Detener flujo, no guardar en local
      }
      
      const data = await res.json();
      finalId = data.user.id; // Usar el ID real de PostgreSQL
      console.log('✅ Usuario registrado exitosamente en PostgreSQL (Ecosistema distribuido)');
    } catch (err: any) {
      console.warn('⚠️ Backend no disponible. Guardando usuario localmente (Offline).', err.message);
      isOffline = true;
    }

    const newUser: User = {
      id: finalId,
      name: name.trim(),
      email: cleanEmail,
      role,
      community,
    };

    await UserService.createUser(newUser);
    
    const modeStr = isOffline ? '[Offline]' : '[Distribuido]';
    const msg = `Usuario ${name} (${role}) agregado a la comuna ${community}. ${modeStr}`;
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Éxito', msg);

    setName('');
    setEmail('');
    setPassword('');
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    try {
      // 1. Borrar de BDD remota (para consistencia cross-device)
      await fetch(`http://0.0.0.0:8000/api/users/auth/user/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Error borrando usuario en remoto:', err);
    }
    // 2. Borrar del Local Storage (buena práctica de seguridad y caché)
    await UserService.deleteUser(id);
    loadUsers();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
        <Text style={styles.headerSubtitle}>Líder Comunal de {community}</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Añadir Vecino o Policía a {community}</Text>

            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput style={styles.input} placeholder="Ej: Juan Pérez" value={name} onChangeText={setName} />

            <Text style={styles.label}>Correo Electrónico (Login)</Text>
            <TextInput style={styles.input} placeholder="juan@onalert.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Contraseña Temporal</Text>
            <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Rol en la Comunidad</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={role} onValueChange={(val) => setRole(val as UserRole)} style={styles.picker}>
                {roles.map(r => <Picker.Item key={r.value} label={r.label} value={r.value} />)}
              </Picker>
            </View>

            <Pressable style={styles.submitBtn} onPress={handleCreateUser}>
              <Text style={styles.submitText}>Añadir Miembro</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          users.length > 0 ? (
            <View style={styles.listSection}>
              <Text style={styles.listTitle}>Miembros de {community} ({users.length})</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userRole}>{item.role === 'policia_upc' ? '👮 Policía UPC' : '🏠 Vecino'}</Text>
            </View>
            <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="person-remove" size={20} color={colors.error} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, backgroundColor: colors.primary },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  formCard: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: colors.background, fontSize: 15 },
  pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background, overflow: 'hidden' },
  picker: { height: 50 },
  submitBtn: { backgroundColor: colors.success, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  listSection: { marginTop: 10, marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  userCard: { flexDirection: 'row', backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10, alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  userRole: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
});
