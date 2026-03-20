import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { getSessionById } from '../services/workoutService';
import type { WorkoutSession } from '../types/workout';

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

export default function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSessionById(sessionId)
      .then(setSession)
      .catch(() => setError('Séance introuvable'))
      .finally(() => setLoading(false));
  }, [sessionId]);

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
      {/* Back button */}
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Historique</Text>
      </TouchableOpacity>

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

      {/* Per-exercise breakdown */}
      {session.exercises.map((ex, i) => {
        const doneSets = ex.sets.filter((s) => s.completed);
        const exVol = doneSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
        return (
          <View key={i} style={styles.exCard}>
            <View style={styles.exHeader}>
              <Text style={styles.exName}>{ex.exerciseName ?? `Exercice ${i + 1}`}</Text>
              {exVol > 0 && <Text style={styles.exVol}>{formatVolume(exVol)}</Text>}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#a0a0a0', fontFamily: 'Rowan-Regular', fontSize: 15, marginBottom: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backArrow: { fontSize: 20, color: '#EFBF04' },
  backLabel: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#a0a0a0' },
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
  exCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  exName: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#fafafa', flex: 1 },
  exVol: { fontFamily: 'Quilon-Medium', fontSize: 13, color: '#EFBF04' },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  setNum: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#a0a0a0' },
  setData: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#fafafa' },
});
