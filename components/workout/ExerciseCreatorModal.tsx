import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { MuscleGroup } from '../../types/workout';
import { createCustomExercise } from '../../services/workoutService';
import { useToast } from '../../context/ToastContext';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Full Body',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function ExerciseCreatorModal({ visible, onClose, onCreated }: Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setName('');
    setMuscleGroup(null);
    setEquipment('');
    setDescription('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    if (!muscleGroup) {
      toast.error('Choisis un groupe musculaire');
      return;
    }

    setLoading(true);
    try {
      await createCustomExercise({
        name: name.trim(),
        muscleGroup,
        equipment: equipment.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast.success('Exercice créé');
      reset();
      onCreated();
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvel exercice</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Curl marteau incliné"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Groupe musculaire *</Text>
            <View style={styles.pillsRow}>
              {MUSCLE_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  activeOpacity={0.7}
                  onPress={() => setMuscleGroup(g)}
                  style={[
                    styles.pill,
                    muscleGroup === g && styles.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      muscleGroup === g && styles.pillTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Équipement</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Haltères, Barre, Machine…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={equipment}
              onChangeText={setEquipment}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Notes, conseils d'exécution…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#EFBF04" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Quilon-Medium',
    color: '#ffffff',
  },
  closeIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Rowan-Regular',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontFamily: 'Rowan-Regular',
    fontSize: 15,
  },
  inputMultiline: {
    height: 100,
    paddingTop: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillActive: {
    backgroundColor: '#EFBF04',
  },
  pillText: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  pillTextActive: {
    color: '#121212',
  },
  createButton: {
    backgroundColor: '#EFBF04',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 16,
    color: '#121212',
  },
});
