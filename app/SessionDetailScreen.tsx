import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { getSessionById, updateSession, deleteSession } from '../services/workoutService';
import type { WorkoutSession } from '../types/workout';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

// Matches web SessionDetail: date, duration, volume, per-exercise sets breakdown

type Props = NativeStackScreenProps<WorkoutStackParamList, 'SessionDetail'>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

const RPE_MIN = 1;
const RPE_MAX = 10;

function calcOneRM(weight: number, reps: number): number | null {
  if (reps < 1 || reps > 10 || weight <= 0) return null;
  const raw = weight * 36 / (37 - reps);
  return Math.round(raw * 2) / 2;
}

export default function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const confirm = useConfirm();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [draftRpe, setDraftRpe] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSessionById(sessionId)
      .then((s) => {
        setSession(s);
        setDraftNotes(s.notes ?? '');
        setDraftRpe(s.rpe);
      })
      .catch(() => setError('Séance introuvable'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  function handleToggleEdit() {
    if (editMode) {
      // Cancel — reset drafts
      setDraftNotes(session?.notes ?? '');
      setDraftRpe(session?.rpe);
    }
    setEditMode((v) => !v);
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      const updated = await updateSession(session.id, {
        notes: draftNotes || undefined,
        rpe: draftRpe,
      });
      setSession(updated);
      setEditMode(false);
      toast.success('Séance mise à jour');
    } catch {
      toast.error('Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!session) return;
    const ok = await confirm({
      title: 'Supprimer la séance',
      message: 'Cette action est irréversible. La séance sera définitivement supprimée.',
      confirmText: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteSession(session.id);
      navigation.goBack();
    } catch {
      toast.error('Impossible de supprimer la séance');
    }
  }

  function handleRpeStep(dir: 1 | -1) {
    setDraftRpe((prev) => {
      const current = prev ?? 5;
      const next = current + dir;
      if (next < RPE_MIN || next > RPE_MAX) return prev;
      return next;
    });
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? 'Erreur'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalVolume = session.exercises.flatMap((e) => e.sets).reduce(
    (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
    0
  );
  const completedSets = session.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back + edit header */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Historique</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={handleToggleEdit} activeOpacity={0.7}>
          <Ionicons
            name={editMode ? 'close-outline' : 'create-outline'}
            size={22}
            color={editMode ? '#a0a0a0' : '#EFBF04'}
          />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <Text style={styles.programName}>{session.programName ?? 'Séance libre'}</Text>
      <Text style={styles.dateText}>{formatDate(session.startedAt)}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statChipVal}>{completedSets}</Text>
          <Text style={styles.statChipLabel}>sets</Text>
        </View>
        {session.durationMinutes != null && (
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>{session.durationMinutes} min</Text>
            <Text style={styles.statChipLabel}>durée</Text>
          </View>
        )}
        {totalVolume > 0 && (
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>{formatVolume(totalVolume)}</Text>
            <Text style={styles.statChipLabel}>volume</Text>
          </View>
        )}
      </View>

      {/* Edit mode: notes + RPE */}
      {editMode && (
        <View style={styles.editSection}>
          <Text style={styles.editLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Ajouter des notes sur cette séance…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={draftNotes}
            onChangeText={setDraftNotes}
            textAlignVertical="top"
          />

          <Text style={styles.editLabel}>RPE (Effort perçu)</Text>
          <View style={styles.rpeRow}>
            <TouchableOpacity
              style={styles.rpeStepBtn}
              onPress={() => handleRpeStep(-1)}
              activeOpacity={0.7}
            >
              <Text style={styles.rpeStepText}>−</Text>
            </TouchableOpacity>
            <View style={styles.rpeValueWrap}>
              <Text style={styles.rpeValue}>
                {draftRpe != null ? String(draftRpe) : '—'}
              </Text>
              <Text style={styles.rpeScale}>/10</Text>
            </View>
            <TouchableOpacity
              style={styles.rpeStepBtn}
              onPress={() => handleRpeStep(1)}
              activeOpacity={0.7}
            >
              <Text style={styles.rpeStepText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Notes display (read mode) */}
      {!editMode && session.notes != null && session.notes.length > 0 && (
        <View style={styles.notesDisplay}>
          <Text style={styles.notesDisplayLabel}>Notes</Text>
          <Text style={styles.notesDisplayText}>{session.notes}</Text>
        </View>
      )}

      {/* RPE display (read mode) */}
      {!editMode && session.rpe != null && (
        <View style={styles.rpeDisplay}>
          <Text style={styles.rpeDisplayLabel}>RPE</Text>
          <Text style={styles.rpeDisplayVal}>{session.rpe}<Text style={styles.rpeDisplayScale}>/10</Text></Text>
        </View>
      )}

      {/* Per-exercise breakdown */}
      {session.exercises.map((ex, i) => {
        const doneSets = ex.sets.filter((s) => s.completed);
        const exVol = doneSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
        const bestOneRM = doneSets.reduce<number | null>((best, s) => {
          const orm = s.weight && s.reps ? calcOneRM(s.weight, s.reps) : null;
          if (orm === null) return best;
          return best === null || orm > best ? orm : best;
        }, null);
        return (
          <View key={i} style={styles.exCard}>
            <View style={styles.exHeader}>
              <Text style={styles.exName}>{ex.exerciseName ?? `Exercice ${i + 1}`}</Text>
              <View style={styles.exHeaderRight}>
                {bestOneRM !== null && (
                  <View style={styles.ormBadge}>
                    <Text style={styles.ormBadgeText}>1RM ~{bestOneRM}kg</Text>
                  </View>
                )}
                {exVol > 0 && <Text style={styles.exVol}>{formatVolume(exVol)}</Text>}
              </View>
            </View>
            {doneSets.map((s, j) => (
              <View key={j} style={styles.setRow}>
                <Text style={styles.setNum}>Set {j + 1}</Text>
                <Text style={styles.setData}>
                  {s.weight ? `${s.weight}kg` : '—'} × {s.reps ?? '—'} reps
                  {s.rpe != null ? `  RPE ${s.rpe}` : ''}
                </Text>
              </View>
            ))}
          </View>
        );
      })}

      {/* Delete button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
        <Text style={styles.deleteBtnText}>Supprimer la séance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#a0a0a0', fontFamily: 'Rowan-Regular', fontSize: 15, marginBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 20, color: '#EFBF04' },
  backLabel: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#a0a0a0' },
  editBtn: { padding: 4 },
  backBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8 },
  backBtnText: { color: '#fafafa', fontFamily: 'Rowan-Regular', fontSize: 14 },
  programName: { fontFamily: 'Quilon-Medium', fontSize: 24, color: '#fafafa', marginBottom: 4 },
  dateText: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#a0a0a0', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statChipVal: { fontFamily: 'Quilon-Medium', fontSize: 16, color: '#EFBF04' },
  statChipLabel: { fontFamily: 'Rowan-Regular', fontSize: 11, color: '#a0a0a0', marginTop: 2 },
  // Edit section
  editSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  editLabel: { fontFamily: 'Quilon-Medium', fontSize: 13, color: '#a0a0a0' },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 14,
  },
  rpeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rpeStepBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeStepText: { color: '#fafafa', fontSize: 22, lineHeight: 26 },
  rpeValueWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  rpeValue: { fontFamily: 'Quilon-Medium', fontSize: 28, color: '#EFBF04' },
  rpeScale: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#a0a0a0' },
  saveBtn: {
    backgroundColor: '#EFBF04',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#000' },
  // Notes / RPE display (read mode)
  notesDisplay: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  notesDisplayLabel: { fontFamily: 'Quilon-Medium', fontSize: 12, color: '#a0a0a0' },
  notesDisplayText: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#fafafa', lineHeight: 20 },
  rpeDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  rpeDisplayLabel: { fontFamily: 'Quilon-Medium', fontSize: 13, color: '#a0a0a0' },
  rpeDisplayVal: { fontFamily: 'Quilon-Medium', fontSize: 18, color: '#EFBF04' },
  rpeDisplayScale: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#a0a0a0' },
  // Exercises
  exCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  exName: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#fafafa', flex: 1 },
  exHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ormBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ormBadgeText: { fontFamily: 'Rowan-Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  exVol: { fontFamily: 'Quilon-Medium', fontSize: 13, color: '#EFBF04' },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  setNum: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#a0a0a0' },
  setData: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#fafafa' },
  // Delete
  deleteBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#ef4444' },
});
