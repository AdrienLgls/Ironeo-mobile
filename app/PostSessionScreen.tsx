import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { updateWorkoutSession } from '../services/workoutService';
import { FadeInUp, StaggerChildren } from '../components/ui/FadeIn';
import type { WorkoutSession } from '../types/workout';
import { ShareCardStats } from '../components/share/ShareCard';
import ShareButton from '../components/share/ShareButton';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'PostSession'>;

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  }
  return `${minutes} min`;
}

export default function PostSessionScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [saving, setSaving] = useState(true);
  const shareCardRef = useRef<ViewShot>(null);

  useEffect(() => {
    updateWorkoutSession(sessionId, { completedAt: new Date().toISOString() })
      .then(setSession)
      .catch(() => undefined)
      .finally(() => setSaving(false));
  }, [sessionId]);

  const stats = useMemo(() => {
    if (!session) return { totalSets: 0, completedSets: 0, totalVolume: 0, avgRpe: null };

    const allSets = session.exercises.flatMap((ex) => ex.sets);
    const doneSets = allSets.filter((s) => s.completed);
    const totalVolume = doneSets.reduce(
      (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
      0
    );
    const rpeSets = doneSets.filter((s) => s.rpe != null);
    const avgRpe = rpeSets.length > 0
      ? rpeSets.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / rpeSets.length
      : null;

    return {
      totalSets: allSets.length,
      completedSets: doneSets.length,
      totalVolume,
      avgRpe,
    };
  }, [session]);

  const prs = useMemo(() => {
    // Show exercises where a completed set exists (placeholder for real PR detection)
    if (!session) return [];
    return session.exercises
      .filter((ex) => ex.sets.some((s) => s.completed && (s.weight || 0) > 0))
      .slice(0, 3)
      .map((ex) => {
        const maxWeight = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.weight || 0));
        return { name: ex.exerciseName || 'Exercice', weight: maxWeight };
      });
  }, [session]);

  const completionRate = stats.totalSets > 0
    ? Math.round((stats.completedSets / stats.totalSets) * 100)
    : 0;

  if (saving) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
        <ActivityIndicator color="#EFBF04" size="large" />
        <Text style={styles.savingText}>Sauvegarde de ta séance...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Trophy header */}
      <FadeInUp>
        <View style={styles.header}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>Séance terminée !</Text>
          <Text style={styles.subtitle}>
            {session?.programName ?? 'Séance libre'}
          </Text>
        </View>
      </FadeInUp>

      {/* Stats grid */}
      <StaggerChildren staggerMs={80} baseDelay={200}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedSets}</Text>
            <Text style={styles.statLabel}>Sets complétés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {session?.durationMinutes ? formatDuration(session.durationMinutes) : '—'}
            </Text>
            <Text style={styles.statLabel}>Durée</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatVolume(stats.totalVolume)}</Text>
            <Text style={styles.statLabel}>Volume total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.avgRpe != null ? stats.avgRpe.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>RPE moyen</Text>
          </View>
        </View>

        {/* Completion bar */}
        <View style={styles.completionCard}>
          <View style={styles.completionRow}>
            <Text style={styles.completionLabel}>Complétion</Text>
            <Text style={styles.completionPct}>{completionRate}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionRate}%` as unknown as number }]} />
          </View>
        </View>

        {/* Per-exercise breakdown */}
        {session && session.exercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Par exercice</Text>
            {session.exercises.map((ex, i) => {
              const done = ex.sets.filter((s) => s.completed);
              const vol = done.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
              return (
                <View key={i} style={styles.exRow}>
                  <Text style={styles.exName} numberOfLines={1}>
                    {ex.exerciseName || `Exercice ${i + 1}`}
                  </Text>
                  <View style={styles.exRight}>
                    <Text style={styles.exSets}>{done.length} sets</Text>
                    {vol > 0 && <Text style={styles.exVol}>{formatVolume(vol)}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Share card */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Partager ta séance</Text>
          <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1 }}>
            <ShareCardStats
              pseudo="Toi"
              level={1}
              totalSessions={stats.completedSets}
              totalVolume={stats.totalVolume}
              totalPRs={0}
              streak={0}
            />
          </ViewShot>
          <ShareButton cardRef={shareCardRef} label="Partager" />
        </View>

        {/* CTAs */}
        <View style={styles.ctaArea}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProgramsList')}
          >
            <Text style={styles.ctaPrimaryText}>Retour aux programmes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaSecondary}
            activeOpacity={0.8}
            onPress={() => navigation.getParent()?.navigate('Home')}
          >
            <Text style={styles.ctaSecondaryText}>Accueil</Text>
          </TouchableOpacity>
        </View>
      </StaggerChildren>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  savingText: { color: '#a0a0a0', fontFamily: 'Rowan-Regular', fontSize: 14, marginTop: 12 },
  scroll: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 16, paddingBottom: 40, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  trophy: { fontSize: 56, marginBottom: 12 },
  title: { fontFamily: 'Quilon-Medium', fontSize: 28, color: '#fafafa', marginBottom: 4 },
  subtitle: { fontFamily: 'Rowan-Regular', fontSize: 15, color: '#a0a0a0' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontFamily: 'Quilon-Medium', fontSize: 22, color: '#EFBF04', marginBottom: 4 },
  statLabel: { fontFamily: 'Rowan-Regular', fontSize: 12, color: '#a0a0a0' },
  completionCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  completionLabel: { fontFamily: 'Quilon-Medium', fontSize: 14, color: '#fafafa' },
  completionPct: { fontFamily: 'Quilon-Medium', fontSize: 14, color: '#EFBF04' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#EFBF04', borderRadius: 3 },
  section: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#fafafa', marginBottom: 12 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  exName: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#fafafa', flex: 1 },
  exRight: { flexDirection: 'row', gap: 8 },
  exSets: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#a0a0a0' },
  exVol: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#EFBF04' },
  ctaArea: { width: '100%', gap: 10, marginTop: 8 },
  ctaPrimary: {
    backgroundColor: '#EFBF04',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPrimaryText: { fontFamily: 'Quilon-Medium', fontSize: 16, color: '#0a0a0a' },
  ctaSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaSecondaryText: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#fafafa' },
  shareSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
});
