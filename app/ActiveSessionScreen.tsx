import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import RestTimer from '../components/workout/RestTimer';
import type { ProgramDetail } from '../types/workout';

const DEFAULT_REST_SECONDS = 90;

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ActiveSession'> & {
  program: ProgramDetail;
};

export default function ActiveSessionScreen({ navigation, program }: Props) {
  const { state, startSession, completeSet, currentExercise, currentSet, progress, completedSets, totalSets } =
    useWorkoutSession(program);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);

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
        <Text className="text-white/40 text-body-sm font-body">No exercises found</Text>
      </View>
    );
  }

  const exerciseProgress = `${state.currentExerciseIndex + 1} / ${state.exercises.length}`;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-8">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">✕ End session</Text>
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
        <Text className="text-white/40 text-overline font-body uppercase tracking-wider mb-1">
          Exercise {exerciseProgress}
        </Text>
        <Text className="text-white text-h2 font-heading">{currentExercise.exerciseName}</Text>
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
                <Text className={`text-caption font-body ${isDone ? 'text-black' : 'text-white'}`}>
                  {isDone ? '✓' : idx + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-body-sm font-body">Set {idx + 1}</Text>
                <Text className="text-white/40 text-caption font-body">{set.reps} reps</Text>
              </View>
              {isCurrent && !isDone && (
                <View className="bg-white/[0.08] rounded-xl px-3 py-1">
                  <Text className="text-white/60 text-caption font-body">Current</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Text className="text-white/40 text-caption font-body text-center mb-6">
        {completedSets} / {totalSets} sets completed
      </Text>

      {/* Rest timer */}
      {showRestTimer && (
        <RestTimer
          durationSeconds={restDuration}
          onComplete={() => { setShowRestTimer(false); completeSet(); }}
          onSkip={() => { setShowRestTimer(false); completeSet(); }}
        />
      )}

      {/* Done button */}
      {!showRestTimer && (
        <TouchableOpacity
          onPress={() => {
            const ex = program.days[0]?.exercises[state.currentExerciseIndex];
            const rest = ex?.restSeconds ?? DEFAULT_REST_SECONDS;
            setRestDuration(rest);
            setShowRestTimer(true);
          }}
          className="bg-accent rounded-2xl py-5 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-black text-h6 font-heading">
            {state.currentSetIndex + 1 >= currentExercise.sets.length
              ? 'Next exercise →'
              : `Set ${state.currentSetIndex + 1} done ✓`}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
