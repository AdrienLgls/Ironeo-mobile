import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { getExerciseById } from '../services/workoutService';
import type { Exercise } from '../types/workout';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const { exerciseId } = route.params;
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExerciseById(exerciseId)
      .then(setExercise)
      .catch(() => setError('Unable to load exercise'))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-red-400 text-body-sm font-body">{error ?? 'Exercise not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-8">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-2">{exercise.name}</Text>

      {exercise.muscleGroups.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-6">
          {exercise.muscleGroups.map((group) => (
            <View key={group} className="bg-accent/20 rounded-full px-3 py-1">
              <Text className="text-accent text-caption font-body capitalize">{group}</Text>
            </View>
          ))}
        </View>
      )}

      {exercise.instructions && (
        <View className="mb-6">
          <Text className="text-white/60 text-overline font-body uppercase tracking-wider mb-2">Instructions</Text>
          <Text className="text-white/80 text-body-sm font-body leading-relaxed">{exercise.instructions}</Text>
        </View>
      )}

      {exercise.tips && (
        <View className="bg-white/[0.04] rounded-2xl p-4">
          <Text className="text-accent text-overline font-body uppercase tracking-wider mb-2">Tips</Text>
          <Text className="text-white/70 text-body-sm font-body leading-relaxed">{exercise.tips}</Text>
        </View>
      )}
    </ScrollView>
  );
}
