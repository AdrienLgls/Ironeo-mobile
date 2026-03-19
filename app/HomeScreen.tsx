import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { getUserStats } from '../services/userService';
import type { UserStats } from '../types/user';

export default function HomeScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserStats()
      .then(setStats)
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
    </ScrollView>
  );
}
