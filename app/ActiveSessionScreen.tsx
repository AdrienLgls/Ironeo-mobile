import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import RestTimer from '../components/workout/RestTimer';
import SetRow from '../components/workout/SetRow';
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

  function handleSetComplete(weight: number, reps: number, rpe: number) {
    const ex = program.days[0]?.exercises[state.currentExerciseIndex];
    const rest = ex?.restSeconds ?? DEFAULT_REST_SECONDS;
    setRestDuration(rest);
    setShowRestTimer(true);
    completeSet();
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-8">
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">✕ Terminer la séance</Text>
      </TouchableOpacity>

      {/* Progress bar */}
      <View className="h-1 bg-white/[0.08] rounded-full mb-6">
        <View
          className="h-full bg-accent rounded-full"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>

      {/* Exercise header */}
      <View className="mb-6">
        <Text className="text-white/40 text-overline font-body uppercase mb-1">
          Exercice {exerciseProgress}
        </Text>
        <Text className="text-white text-h2 font-heading mb-2">{currentExercise.exerciseName}</Text>
        <Text className="text-white/30 text-caption font-body">
          {completedSets} / {totalSets} sets terminés
        </Text>
      </View>

      {/* Rest timer overlay */}
      {showRestTimer && (
        <View className="mb-6">
          <RestTimer
            durationSeconds={restDuration}
            onComplete={() => setShowRestTimer(false)}
            onSkip={() => setShowRestTimer(false)}
          />
        </View>
      )}

      {/* Sets list */}
      {!showRestTimer && (
        <View className="mb-6">
          {currentExercise.sets.map((set, idx) => (
            <SetRow
              key={idx}
              set={set}
              index={idx}
              isCurrent={idx === state.currentSetIndex}
              onComplete={handleSetComplete}
              onUpdate={() => undefined}
            />
          ))}
        </View>
      )}

      {/* Progress indicator */}
      <View className="bg-white/[0.02] rounded-2xl p-4 items-center">
        <Text className="text-white/40 text-caption font-body">
          {completedSets} / {totalSets} sets · Exercice {state.currentExerciseIndex + 1}/{state.exercises.length}
        </Text>
      </View>
    </ScrollView>
  );
}
