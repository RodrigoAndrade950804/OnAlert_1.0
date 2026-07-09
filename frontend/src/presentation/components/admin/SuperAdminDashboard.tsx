import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { QUITO_SECTORS } from '@onalert/shared';
import {  colors  } from '@onalert/shared';
import {  User, UserRole  } from '@onalert/shared';
import { UserService } from '@/src/infrastructure/services/UserService';
import { Ionicons } from '@expo/vector-icons';

export function SuperAdminDashboard() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [community, setCommunity] = useState(QUITO_SECTORS[0]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    // Solo cargamos a los Administradores de Barrio (Líderes Comunales)
    const allUsers = await UserService.getUsersByRole('admin');
    setUsers(allUsers);
  };

  const handleCreateAdmin = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      if (Platform.OS === 'web') window.alert('Llena todos los campos');
      else Alert.alert('Error', 'Llena todos los campos');
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let isOffline = false;
    let finalId = `admin_${Date.now()}`;

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
          role: 'admin',
          communityName: community
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (Platform.OS === 'web') window.alert(errorData.error);
        else Alert.alert('Error', errorData.error);
        return; // Detener flujo
      }
      
      const data = await res.json();
      finalId = data.user.id;
      console.log('✅ Usuario registrado exitosamente en PostgreSQL');
    } catch (err: any) {
      console.warn('⚠️ Backend no disponible. Guardando usuario localmente (Offline).', err.message);
      isOffline = true;
    }

    const newUser: User = {
      id: finalId,
      name: name.trim(),
      email: cleanEmail,
      role: 'admin',
      community,
    };

    await UserService.createUser(newUser);
    
    const modeStr = isOffline ? '[Offline]' : '[Distribuido]';
    const msg = `Líder Comunal ${name} asignado a ${community}. ${modeStr}`;
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
        <Text style={styles.headerTitle}>Gestión de Líderes Comunales</Text>
        <Text style={styles.headerSubtitle}>Dueño / Súper Administrador</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Registrar Nuevo Líder (Admin)</Text>

            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput style={styles.input} placeholder="Ej: Juan Pérez" value={name} onChangeText={setName} />

            <Text style={styles.label}>Correo Electrónico (Login)</Text>
            <TextInput style={styles.input} placeholder="juan@onalert.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Contraseña Temporal</Text>
            <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Sector Asignado</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={community} onValueChange={setCommunity} style={styles.picker}>
                {QUITO_SECTORS.map(s => <Picker.Item key={s} label={s} value={s} />)}
              </Picker>
            </View>

            <Pressable style={styles.submitBtn} onPress={handleCreateAdmin}>
              <Text style={styles.submitText}>Crear Líder Comunal</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          users.length > 0 ? (
            <View style={styles.listSection}>
              <Text style={styles.listTitle}>Líderes Activos ({users.length})</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userSector}>📍 {item.community}</Text>
            </View>
            <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash" size={20} color={colors.error} />
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
  userSector: { fontSize: 13, color: colors.info, marginTop: 4, fontWeight: '600' },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
});
