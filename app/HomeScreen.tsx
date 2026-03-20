import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { getUserStats, getRecentSessions } from '../services/userService';
import RecentSessionCard from '../components/home/RecentSessionCard';
import type { UserStats, RecentSession } from '../types/user';

export default function HomeScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSession, setRecentSession] = useState<RecentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getUserStats(), getRecentSessions()])
      .then(([statsData, sessions]) => {
        setStats(statsData);
        setRecentSession(sessions[0] ?? null);
      })
      .catch(() => setError('Unable to load stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-6">
      <Text className="text-white text-2xl font-bold mb-6">Dashboard</Text>

      {loading && (
        <ActivityIndicator color="#EFBF04" size="large" className="mt-8" />
      )}

      {error && (
        <Text className="text-red-400 text-sm text-center mt-4">{error}</Text>
      )}

      {stats && (
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-white/[0.05] rounded-2xl p-4">
            <Text className="text-accent text-3xl font-bold">{stats.streak}</Text>
            <Text className="text-white/60 text-xs mt-1">Day streak</Text>
          </View>
          <View className="flex-1 bg-white/[0.05] rounded-2xl p-4">
            <Text className="text-accent text-3xl font-bold">{stats.workoutsThisWeek}</Text>
            <Text className="text-white/60 text-xs mt-1">This week</Text>
          </View>
          <View className="flex-1 bg-white/[0.05] rounded-2xl p-4">
            <Text className="text-accent text-3xl font-bold">{stats.totalWorkouts}</Text>
            <Text className="text-white/60 text-xs mt-1">Total</Text>
          </View>
        </View>
      )}

      {!loading && recentSession && (
        <RecentSessionCard session={recentSession} onPress={() => undefined} />
      )}

      {!loading && !recentSession && !error && (
        <View className="bg-white/[0.03] rounded-2xl p-4">
          <Text className="text-white/40 text-sm text-center">No recent workout</Text>
        </View>
      )}
    </ScrollView>
  );
}
