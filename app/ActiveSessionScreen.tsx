import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import type { ProgramDetail } from '../types/workout';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ActiveSession'> & {
  program: ProgramDetail;
};

export default function ActiveSessionScreen({ navigation, program }: Props) {
  const { state, startSession, completeSet, currentExercise, currentSet, progress, completedSets, totalSets } =
    useWorkoutSession(program);

  useEffect(() => {
    startSession().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (state.isComplete) {
      navigation.replace('PostSession', { sessionId: state.sessionId ?? '' });
    }
  }, [state.isComplete]);

  if (!currentExercise || !currentSet) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-white/40">No exercises found</Text>
      </View>
    );
  }

  const exerciseProgress = `${state.currentExerciseIndex + 1} / ${state.exercises.length}`;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-8">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-sm">✕ End session</Text>
      </TouchableOpacity>

      {/* Progress bar */}
      <View className="h-1 bg-white/[0.08] rounded-full mb-8">
        <View
          className="h-full bg-accent rounded-full"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>

      {/* Exercise header */}
      <View className="mb-2">
        <Text className="text-white/40 text-xs uppercase tracking-wider mb-1">
          Exercise {exerciseProgress}
        </Text>
        <Text className="text-white text-3xl font-bold">{currentExercise.exerciseName}</Text>
      </View>

      {/* Sets list */}
      <View className="mt-6 mb-8">
        {currentExercise.sets.map((set, idx) => {
          const isCurrent = idx === state.currentSetIndex;
          const isDone = set.completed;

          return (
            <View
              key={idx}
              className={`flex-row items-center py-4 border-b border-white/[0.05] ${isCurrent ? 'opacity-100' : 'opacity-40'}`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${isDone ? 'bg-accent' : 'bg-white/[0.08]'}`}>
                <Text className={`text-xs font-bold ${isDone ? 'text-black' : 'text-white'}`}>
                  {isDone ? '✓' : idx + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm">Set {idx + 1}</Text>
                <Text className="text-white/40 text-xs">{set.reps} reps</Text>
              </View>
              {isCurrent && !isDone && (
                <View className="bg-white/[0.08] rounded-xl px-3 py-1">
                  <Text className="text-white/60 text-xs">Current</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Text className="text-white/40 text-xs text-center mb-6">
        {completedSets} / {totalSets} sets completed
      </Text>

      {/* Done button */}
      <TouchableOpacity
        onPress={completeSet}
        className="bg-accent rounded-2xl py-5 items-center"
        activeOpacity={0.8}
      >
        <Text className="text-black font-bold text-lg">
          {state.currentSetIndex + 1 >= currentExercise.sets.length
            ? 'Next exercise →'
            : `Set ${state.currentSetIndex + 1} done ✓`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
