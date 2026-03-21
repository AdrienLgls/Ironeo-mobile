import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './TabNavigator';

const DRAFT_KEY = 'active_session_draft';

interface SessionDraft {
  programId: string;
  programName: string;
  startedAt: string;
  completedSets: number;
}
import {
  getUserStats,
  getRecentSessions,
  getNextWorkout,
  getFollowedPrograms,
  getDueReviews,
  getActiveSession,
  getTodaySession,
  getPoints,
} from '../services/userService';
import type {
  FollowedProgram,
  ActiveSessionInfo,
  DueReview,
  PointsData,
} from '../services/userService';
import api from '../services/api';
import HeroCard from '../components/home/HeroCard';
import StreakChain from '../components/home/StreakChain';
import WeeklyProgressRings from '../components/home/WeeklyProgressRings';
import RecentSessionCard from '../components/home/RecentSessionCard';
import NextWorkoutCard from '../components/home/NextWorkoutCard';
import ProgressWidget from '../components/home/ProgressWidget';
import type { UserStats, RecentSession, NextWorkout, UserProfile } from '../types/user';

type HomeNav = BottomTabNavigationProp<TabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSession, setRecentSession] = useState<RecentSession | null>(null);
  const [nextWorkout, setNextWorkout] = useState<NextWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);

  // Context-aware state data
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [todaySession, setTodaySession] = useState<{ programName?: string } | null>(null);
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [followedPrograms, setFollowedPrograms] = useState<FollowedProgram[]>([]);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);

  useEffect(() => {
    async function checkDraft() {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as SessionDraft;
      const ageMs = Date.now() - new Date(draft.startedAt).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        setSessionDraft(draft);
      } else {
        await AsyncStorage.removeItem(DRAFT_KEY);
      }
    }
    checkDraft().catch(() => undefined);
  }, []);

  const loadData = useCallback(() =>
    Promise.all([
      api.get<UserProfile>('/users/me').then(({ data }) => data),
      getUserStats(),
      getRecentSessions(),
      getNextWorkout(),
      getActiveSession(),
      getTodaySession(),
      getDueReviews(),
      getFollowedPrograms(),
      getPoints(),
    ])
      .then(([profileData, statsData, sessions, next, activeSess, today, dueReviews, followed, points]) => {
        setProfile(profileData);
        setStats(statsData);
        setRecentSession(sessions[0] ?? null);
        setNextWorkout(next);
        setActiveSession(activeSess);
        if (today) {
          setWorkoutCompleted(today.completed);
          setTodaySession(today.completed ? null : { programName: today.programName });
        } else {
          setWorkoutCompleted(false);
          setTodaySession(null);
        }
        setDueReviews(dueReviews);
        setFollowedPrograms(followed);
        setPointsData(points);
      })
      .catch(() => setError('Unable to load stats'))
      .finally(() => setLoading(false)),
  []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EFBF04" />} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 24 }}>
      {error && (
        <Text className="text-red-400 text-body-sm font-body text-center mb-4">{error}</Text>
      )}

      {/* Session draft recovery banner */}
      {sessionDraft !== null && (
        <View
          style={{
            backgroundColor: 'rgba(239,191,4,0.12)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(239,191,4,0.3)',
          }}
        >
          <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 13, marginBottom: 4 }}>
            Séance en cours • {sessionDraft.completedSets} sets complétés • Reprendre ?
          </Text>
          <Text style={{ color: 'rgba(239,191,4,0.7)', fontFamily: 'Rowan-Regular', fontSize: 11, marginBottom: 12 }}>
            {sessionDraft.programName}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Workout')}
              style={{
                flex: 1,
                backgroundColor: '#EFBF04',
                borderRadius: 10,
                paddingVertical: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#121212', fontFamily: 'Rowan-Regular', fontSize: 13, fontWeight: '600' }}>
                Reprendre
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                AsyncStorage.removeItem(DRAFT_KEY).catch(() => undefined);
                setSessionDraft(null);
              }}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 10,
                paddingVertical: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 13 }}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* HeroCard: context-aware greeting + XP bar */}
      {profile && (
        <HeroCard
          userName={profile?.name?.split(' ')[0] || ''}
          level={pointsData?.level ?? stats?.level ?? 1}
          xp={pointsData?.currentLevelXP ?? stats?.xp ?? 0}
          xpToNextLevel={pointsData?.xpToNextLevel ?? stats?.xpToNextLevel ?? 100}
          onStartWorkout={() => navigation.navigate('Workout')}
          onResumeSession={() => navigation.navigate('Workout')}
          onLearn={() => navigation.navigate('Learn')}
          activeSession={activeSession}
          workoutCompleted={workoutCompleted}
          todaySession={todaySession}
          dueReviewsCount={dueReviews.length}
          followedPrograms={followedPrograms}
        />
      )}

      {/* Streak chain */}
      {stats && (
        <StreakChain currentStreak={stats.streak} />
      )}

      {/* Weekly progress rings */}
      {stats && (
        <WeeklyProgressRings
          sessions={stats.workoutsThisWeek}
          sessionsGoal={4}
          volumeKg={0}
          volumeGoal={5}
          intensity={0}
          intensityGoal={8}
        />
      )}

      {/* Stats row */}
      {stats && (
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-white/[0.05] rounded-2xl p-4">
            <Text className="text-accent text-h2 font-heading">{stats.streak}</Text>
            <Text className="text-white/60 text-caption font-body mt-1">Jours consécutifs</Text>
          </View>
          <View className="flex-1 bg-white/[0.05] rounded-2xl p-4">
            <Text className="text-accent text-h2 font-heading">{stats.workoutsThisWeek}</Text>
            <Text className="text-white/60 text-caption font-body mt-1">Cette semaine</Text>
          </View>
          <View className="flex-1 bg-white/[0.05] rounded-2xl p-4">
            <Text className="text-accent text-h2 font-heading">{stats.totalWorkouts}</Text>
            <Text className="text-white/60 text-caption font-body mt-1">Total</Text>
          </View>
        </View>
      )}

      {stats && (
        <ProgressWidget currentWeight={stats.currentWeight} goalWeight={stats.goalWeight} />
      )}

      <NextWorkoutCard nextWorkout={nextWorkout} onStart={() => navigation.navigate('Workout')} />

      {recentSession && (
        <RecentSessionCard session={recentSession} onPress={() => undefined} />
      )}

      {!recentSession && !error && (
        <View className="bg-white/[0.03] rounded-2xl p-4">
          <Text className="text-white/40 text-caption font-body text-center">Aucune séance récente</Text>
        </View>
      )}
    </ScrollView>
  );
}
