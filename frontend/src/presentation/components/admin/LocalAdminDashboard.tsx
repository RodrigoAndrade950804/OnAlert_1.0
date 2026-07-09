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

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('vecino');

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

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      if (Platform.OS === 'web') window.alert('Llena todos los campos');
      else Alert.alert('Error', 'Llena todos los campos');
      return;
    }
    
    try {
      const { getApiGatewayUrl } = require('@onalert/shared');
      const API_URL = getApiGatewayUrl();
      const res = await fetch(`${API_URL}/api/auth/user/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim(), role: editRole })
      });
      if (!res.ok) {
        const errorData = await res.json();
        if (Platform.OS === 'web') window.alert(errorData.error);
        else Alert.alert('Error', errorData.error);
        return;
      }
    } catch (err) {
      console.warn('Error editando usuario en remoto:', err);
    }

    await UserService.updateUser(editingUser.id, { name: editName.trim(), email: editEmail.trim(), role: editRole });
    setEditingUser(null);
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
              <Text style={styles.userRole}>{item.role === 'policia_upc' ? '👮 Policía UPC' : item.role === 'admin' ? '👑 Líder' : '🏠 Vecino'}</Text>
            </View>
            <Pressable onPress={() => handleEditClick(item)} style={[styles.actionBtnIcon, { backgroundColor: '#DBEAFE', marginRight: 8 }]}>
              <Ionicons name="pencil" size={20} color={colors.info} />
            </Pressable>
            <Pressable onPress={() => handleDelete(item.id)} style={[styles.actionBtnIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="person-remove" size={20} color={colors.error} />
            </Pressable>
          </View>
        )}
      />

      {editingUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.formTitle}>Editar Miembro</Text>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
            
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Rol en la Comunidad</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={editRole} onValueChange={(val) => setEditRole(val as UserRole)} style={styles.picker}>
                {roles.map(r => <Picker.Item key={r.value} label={r.label} value={r.value} />)}
                <Picker.Item label="Líder Comunal (Admin)" value="admin" />
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={[styles.submitBtn, { flex: 1, backgroundColor: colors.textSecondary }]} onPress={() => setEditingUser(null)}>
                <Text style={styles.submitText}>Cancelar</Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable style={[styles.submitBtn, { flex: 1 }]} onPress={handleSaveEdit}>
                <Text style={styles.submitText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
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
  actionBtnIcon: { padding: 8, borderRadius: 8 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, padding: 20, borderRadius: 16 },
  modalActions: { flexDirection: 'row', marginTop: 10 }
});
