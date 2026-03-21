import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { getExerciseById, getExerciseHistory } from '../services/workoutService';
import type { ExerciseHistoryEntry } from '../services/workoutService';
import type { Exercise } from '../types/workout';
import ExerciseHistoryChart from '../components/charts/ExerciseHistoryChart';
import EmptyState from '../components/ui/EmptyState';
import { formatVolume } from '../utils/formatters';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const { exerciseId } = route.params;
  const insets = useSafeAreaInsets();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getExerciseById(exerciseId),
      getExerciseHistory(exerciseId),
    ])
      .then(([ex, hist]) => {
        setExercise(ex);
        setHistory(hist);
      })
      .catch(() => setError('Exercice introuvable'))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={styles.center}>
        <EmptyState type="error" title={error ?? 'Exercice introuvable'} compact />
      </View>
    );
  }

  const allTimeMax = history.length > 0 ? Math.max(...history.map((h) => h.maxWeight)) : null;
  const totalVolume = history.reduce((sum, h) => sum + h.totalVolume, 0);
  const sessionCount = history.length;

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{exercise.name}</Text>

      {exercise.muscleGroups.length > 0 && (
        <View style={styles.tagsRow}>
          {exercise.muscleGroups.map((group) => (
            <View key={group} style={styles.tag}>
              <Text style={styles.tagText}>{group}</Text>
            </View>
          ))}
        </View>
      )}

      {exercise.instructions != null && exercise.instructions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Instructions</Text>
          <Text style={styles.sectionBody}>{exercise.instructions}</Text>
        </View>
      )}

      {exercise.tips != null && exercise.tips.length > 0 && (
        <View style={styles.tipsCard}>
          <Text style={styles.tipsLabel}>Tips</Text>
          <Text style={styles.tipsBody}>{exercise.tips}</Text>
        </View>
      )}

      {/* Performance section */}
      <View style={styles.perfSection}>
        <Text style={styles.perfTitle}>Performance</Text>

        {allTimeMax !== null && (
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipVal}>{allTimeMax}kg</Text>
              <Text style={styles.statChipLabel}>max all-time</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipVal}>{formatVolume(totalVolume)}</Text>
              <Text style={styles.statChipLabel}>volume total</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipVal}>{sessionCount}</Text>
              <Text style={styles.statChipLabel}>séances</Text>
            </View>
          </View>
        )}

        <ExerciseHistoryChart data={history} height={180} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backArrow: { fontSize: 20, color: '#EFBF04' },
  backLabel: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#a0a0a0' },
  title: { fontFamily: 'Quilon-Medium', fontSize: 24, color: '#fafafa', marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: 'rgba(239,191,4,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  tagText: { fontFamily: 'Rowan-Regular', fontSize: 12, color: '#EFBF04' },
  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: 'Quilon-Medium', fontSize: 12, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sectionBody: { fontFamily: 'Rowan-Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
  tipsCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 24 },
  tipsLabel: { fontFamily: 'Quilon-Medium', fontSize: 12, color: '#EFBF04', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tipsBody: { fontFamily: 'Rowan-Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  perfSection: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginTop: 8 },
  perfTitle: { fontFamily: 'Quilon-Medium', fontSize: 16, color: '#fafafa', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statChipVal: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#EFBF04' },
  statChipLabel: { fontFamily: 'Rowan-Regular', fontSize: 11, color: '#a0a0a0', marginTop: 2 },
});
