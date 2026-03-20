import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getWorkoutSessions } from '../services/workoutService';
import type { WorkoutSession } from '../types/workout';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWorkoutSessions()
      .then(setSessions)
      .catch(() => setError('Unable to load history'))
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
    <View className="flex-1 bg-background">
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        ListHeaderComponent={
          <Text className="text-white text-h2 font-heading pt-12 mb-6">History</Text>
        }
        ListEmptyComponent={
          <Text className="text-white/40 text-body-sm font-body text-center mt-8">
            {error ?? 'No workouts yet'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-white/[0.04] rounded-2xl p-4 mb-3"
          >
            <Text className="text-white text-body-sm font-heading mb-1">{item.programName}</Text>
            <View className="flex-row items-center gap-3">
              <Text className="text-white/40 text-caption font-body">{formatDate(item.startedAt)}</Text>
              {item.durationMinutes != null && (
                <Text className="text-white/40 text-caption font-body">{item.durationMinutes} min</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
