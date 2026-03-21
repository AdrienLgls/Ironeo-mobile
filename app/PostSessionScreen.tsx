import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { updateWorkoutSession } from '../services/workoutService';
import { checkPRs, type PRResult } from '../services/prService';
import { registerForPushNotifications } from '../services/pushNotificationService';
import { FadeInUp, StaggerChildren } from '../components/ui/FadeIn';
import type { WorkoutSession } from '../types/workout';
import { ShareCardStats } from '../components/share/ShareCard';
import ShareButton from '../components/share/ShareButton';
import { hapticSuccess } from '../utils/haptics';
import { useAnalytics } from '../hooks/useAnalytics';

async function maybeRequestReview(): Promise<void> {
  try {
    const alreadyRequested = await AsyncStorage.getItem('review_requested');
    if (alreadyRequested === 'true') return;

    const countStr = await AsyncStorage.getItem('sessions_completed_count');
    const count = parseInt(countStr ?? '0', 10) + 1;
    await AsyncStorage.setItem('sessions_completed_count', String(count));

    if (count >= 5 && await StoreReview.hasAction()) {
      await AsyncStorage.setItem('review_requested', 'true');
      await StoreReview.requestReview();
    }
  } catch {
    // Silent fail
  }
}

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

function prTypeLabel(type: PRResult['type']): string {
  switch (type) {
    case 'maxWeight':
      return 'Poids max';
    case 'estimated1RM':
      return '1RM estimé';
    case 'maxRepsAtWeight':
      return 'Reps max';
  }
}

// ─── PRCelebrationModal ──────────────────────────────────────────────────────

interface PRCelebrationModalProps {
  visible: boolean;
  prs: PRResult[];
  onClose: () => void;
}

function PRCelebrationModal({ visible, prs, onClose }: PRCelebrationModalProps) {
  const insets = useSafeAreaInsets();
  const animations = useRef<Animated.Value[]>([]);

  // Initialise one animated value per PR (reuse across renders)
  if (animations.current.length !== prs.length) {
    animations.current = prs.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    if (!visible) return;

    // Reset all
    animations.current.forEach((a) => a.setValue(0));

    // Stagger each item in
    const staggered = animations.current.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 350,
        delay: i * 120,
        useNativeDriver: true,
      })
    );

    Animated.parallel(staggered).start();
  }, [visible, prs.length]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <Text style={modalStyles.title}>🏅 Nouveaux records !</Text>
          <Text style={modalStyles.subtitle}>
            {prs.length === 1 ? '1 record battu' : `${prs.length} records battus`} cette séance
          </Text>

          <ScrollView
            style={modalStyles.list}
            contentContainerStyle={modalStyles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {prs.map((pr, i) => {
              const anim = animations.current[i] ?? new Animated.Value(1);
              const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
              const opacity = anim;

              return (
                <Animated.View
                  key={`${pr.exerciseId}-${pr.type}`}
                  style={[modalStyles.prCard, { opacity, transform: [{ scale }] }]}
                >
                  <View style={modalStyles.prHeader}>
                    <Text style={modalStyles.prName} numberOfLines={1}>
                      {pr.exerciseName}
                    </Text>
                    <Text style={modalStyles.prType}>{prTypeLabel(pr.type)}</Text>
                  </View>
                  <View style={modalStyles.prValues}>
                    <Text style={modalStyles.prNew}>
                      {pr.value} {pr.unit}
                    </Text>
                    <Text style={modalStyles.prDelta}>
                      +{pr.improvement} {pr.unit}
                    </Text>
                  </View>
                  <Text style={modalStyles.prPrev}>
                    Précédent : {pr.previousValue} {pr.unit}
                  </Text>
                </Animated.View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={modalStyles.btn} activeOpacity={0.8} onPress={onClose}>
            <Text style={modalStyles.btnText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#121212',
    borderRadius: 24,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  title: {
    fontFamily: 'Quilon-Medium',
    fontSize: 24,
    color: '#EFBF04',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Rowan-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: { flexGrow: 0 },
  listContent: { gap: 10, paddingBottom: 8 },
  prCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prName: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: '#EFBF04',
    flex: 1,
    marginRight: 8,
  },
  prType: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  prValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  prNew: {
    fontFamily: 'Quilon-Medium',
    fontSize: 22,
    color: '#fafafa',
  },
  prDelta: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: '#4ade80',
  },
  prPrev: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  btn: {
    marginTop: 20,
    backgroundColor: '#EFBF04',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 16,
    color: '#0a0a0a',
  },
});

// ─── PostSessionScreen ───────────────────────────────────────────────────────

export default function PostSessionScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const { trackSessionCompleted, trackPRDetected } = useAnalytics();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [saving, setSaving] = useState(true);
  const [detectedPRs, setDetectedPRs] = useState<PRResult[]>([]);
  const [showPRModal, setShowPRModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const shareCardRef = useRef<ViewShot>(null);

  async function maybeAskForPushPermission(): Promise<void> {
    try {
      const asked = await AsyncStorage.getItem('push_permission_asked');
      if (asked) return;
      setShowPushModal(true);
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const saved = await updateWorkoutSession(sessionId, { completedAt: new Date().toISOString() });
        setSession(saved);
        await hapticSuccess();
        await maybeRequestReview();
        await maybeAskForPushPermission();
        const allSets = saved.exercises.flatMap((ex) => ex.sets);
        const doneSets = allSets.filter((s) => s.completed);
        trackSessionCompleted(
          (saved.durationMinutes ?? 0) * 60,
          doneSets.length,
        );
        const prs = await checkPRs(saved);
        if (prs.length > 0) {
          setDetectedPRs(prs);
          setShowPRModal(true);
          trackPRDetected(prs.length);
          await hapticSuccess();
        }
      } catch {
        Alert.alert(
          'Séance non sauvegardée',
          "La séance n'a pas pu être enregistrée. Tu peux réessayer depuis l'historique.",
          [{ text: 'OK' }]
        );
        // NE PAS bloquer la navigation — l'utilisateur doit pouvoir continuer
      } finally {
        setSaving(false);
      }
    })();
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

  const completionRate = stats.totalSets > 0
    ? Math.round((stats.completedSets / stats.totalSets) * 100)
    : 0;

  const completionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (saving) return;
    Animated.timing(completionAnim, {
      toValue: completionRate,
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [completionAnim, completionRate, saving]);

  if (saving) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 32 }]}>
        <ActivityIndicator color="#EFBF04" size="large" />
        <Text style={styles.savingText}>Sauvegarde de ta séance...</Text>
      </View>
    );
  }

  return (
    <>
      <PRCelebrationModal
        visible={showPRModal}
        prs={detectedPRs}
        onClose={() => setShowPRModal(false)}
      />

      <Modal visible={showPushModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#121212', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontFamily: 'Quilon-Medium', marginBottom: 8 }}>Activez les notifications</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Rowan-Regular', fontSize: 15, marginBottom: 24 }}>
              Soyez alerté quand vous battez un record personnel 🏆 ou quand vos amis vous envoient un message.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#EFBF04', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 }}
              onPress={async () => {
                setShowPushModal(false);
                await AsyncStorage.setItem('push_permission_asked', 'true');
                await registerForPushNotifications().catch(() => undefined);
              }}
            >
              <Text style={{ color: '#000', fontSize: 16, fontFamily: 'Quilon-Medium' }}>Activer les notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 12, alignItems: 'center' }}
              onPress={async () => {
                setShowPushModal(false);
                await AsyncStorage.setItem('push_permission_asked', 'true');
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 14 }}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: completionAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
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
                totalPRs={detectedPRs.length}
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
    </>
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
