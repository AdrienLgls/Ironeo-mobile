import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { updateWorkoutSession } from '../services/workoutService';
import type { WorkoutSession } from '../types/workout';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'PostSession'>;

export default function PostSessionScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    updateWorkoutSession(sessionId, { completedAt: new Date().toISOString() })
      .then(setSession)
      .catch(() => undefined)
      .finally(() => setSaving(false));
  }, [sessionId]);

  const totalSets = session?.exercises.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 0;
  const completedSets = session?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  ) ?? 0;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-16 pb-8 items-center">
      {saving ? (
        <ActivityIndicator color="#EFBF04" size="large" className="mt-16" />
      ) : (
        <>
          <Text className="text-5xl mb-4">🏆</Text>
          <Text className="text-white text-2xl font-bold mb-1">Session complete!</Text>
          <Text className="text-white/40 text-sm mb-10">
            {session?.programName ?? 'Workout'}
          </Text>

          <View className="flex-row gap-4 w-full mb-8">
            <View className="flex-1 bg-white/[0.05] rounded-2xl p-4 items-center">
              <Text className="text-accent text-2xl font-bold">{completedSets}</Text>
              <Text className="text-white/50 text-xs mt-1">Sets done</Text>
            </View>
            <View className="flex-1 bg-white/[0.05] rounded-2xl p-4 items-center">
              <Text className="text-accent text-2xl font-bold">
                {session?.durationMinutes ?? '—'}
              </Text>
              <Text className="text-white/50 text-xs mt-1">Minutes</Text>
            </View>
            <View className="flex-1 bg-white/[0.05] rounded-2xl p-4 items-center">
              <Text className="text-accent text-2xl font-bold">
                {totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%
              </Text>
              <Text className="text-white/50 text-xs mt-1">Completion</Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-accent rounded-2xl py-4 w-full items-center"
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProgramsList')}
          >
            <Text className="text-black font-bold text-base">Back to programs</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
