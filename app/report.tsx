import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useAlerts } from '../context/AlertContext';
import { colors, incidentTypeLabels } from '../constants/theme';
import { getCurrentLocation, getAddressFromCoords } from '../utils/location';
import { IncidentType } from '../types';

const types: IncidentType[] = [
  'robo',
  'sospechoso',
  'incendio',
  'medica',
  'violencia',
  'accidente',
];

export default function ReportScreen() {
  const router = useRouter();
  const { createIncident } = useAlerts();
  const [type, setType] = useState<IncidentType>('sospechoso');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Campos requeridos', 'Completa el título y la descripción.');
      return;
    }

    setSubmitting(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        Alert.alert('Error', 'No se pudo obtener la ubicación.');
        return;
      }
      const address = await getAddressFromCoords(coords);
      const incident = await createIncident({
        type,
        title: title.trim(),
        description: description.trim(),
        location: coords,
        address,
        imageUri,
      });
      Alert.alert('Reporte enviado', 'El incidente fue registrado en la comunidad.', [
        {
          text: 'Ver incidente',
          onPress: () => router.replace(`/incident/${incident.id}`),
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Tipo de incidente</Text>
        <View style={styles.typeGrid}>
          {types.map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text
                style={[styles.typeChipText, type === t && styles.typeChipTextActive]}
              >
                {incidentTypeLabels[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Persona sospechosa en la esquina"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe lo que está ocurriendo..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Evidencia (opcional)</Text>
        <View style={styles.mediaRow}>
          <Pressable style={styles.mediaBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={22} color={colors.primary} />
            <Text style={styles.mediaBtnText}>Cámara</Text>
          </Pressable>
          <Pressable style={styles.mediaBtn} onPress={pickImage}>
            <Ionicons name="images" size={22} color={colors.primary} />
            <Text style={styles.mediaBtnText}>Galería</Text>
          </Pressable>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        )}

        <Pressable
          style={[styles.submitBtn, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Enviando...' : 'Enviar reporte'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 100,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
