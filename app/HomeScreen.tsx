import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './TabNavigator';
import { getUserStats, getRecentSessions, getNextWorkout } from '../services/userService';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<UserProfile>('/users/me').then(({ data }) => data),
      getUserStats(),
      getRecentSessions(),
      getNextWorkout(),
    ])
      .then(([profileData, statsData, sessions, next]) => {
        setProfile(profileData);
        setStats(statsData);
        setRecentSession(sessions[0] ?? null);
        setNextWorkout(next);
      })
      .catch(() => setError('Unable to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-6">
      {error && (
        <Text className="text-red-400 text-body-sm font-body text-center mb-4">{error}</Text>
      )}

      {/* HeroCard: greeting + XP bar */}
      {profile && (
        <HeroCard
          userName={profile.name ?? 'Athlète'}
          level={stats?.level ?? 1}
          xp={stats?.xp ?? 0}
          xpToNextLevel={stats?.xpToNextLevel ?? 1000}
          onStartWorkout={() => navigation.navigate('Workout')}
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
