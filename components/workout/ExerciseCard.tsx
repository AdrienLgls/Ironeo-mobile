import React from 'react';
import { View, Text } from 'react-native';
import type { ProgramExercise } from '../../types/workout';

interface Props {
  exercise: ProgramExercise;
  index: number;
}

export default function ExerciseCard({ exercise, index }: Props) {
  return (
    <View className="flex-row items-center py-3 border-b border-white/[0.05]">
      <View className="w-7 h-7 rounded-full bg-white/[0.05] items-center justify-center mr-3">
        <Text className="text-white/40 text-caption font-body">{index + 1}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-body-sm font-body">{exercise.exerciseName}</Text>
        <Text className="text-white/40 text-caption font-body mt-0.5">
          {exercise.sets} sets × {exercise.reps} reps
          {exercise.restSeconds ? `  ·  ${exercise.restSeconds}s rest` : ''}
        </Text>
      </View>
    </View>
  );
}
