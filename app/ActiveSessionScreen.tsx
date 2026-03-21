import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import RestTimer from '../components/workout/RestTimer';
import SetRow from '../components/workout/SetRow';
import type { ProgramDetail } from '../types/workout';
import { getPersonalRecord } from '../services/workoutService';

const DRAFT_KEY = 'active_session_draft';

const DEFAULT_REST_SECONDS = 90;

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ActiveSession'> & {
  program: ProgramDetail;
};

export default function ActiveSessionScreen({ navigation, program }: Props) {
  const insets = useSafeAreaInsets();
  const { state, startSession, completeSet, currentExercise, currentSet, progress, completedSets, totalSets } =
    useWorkoutSession(program);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);

  // Session timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTime = useRef(Date.now());
  const sessionStartTime = useRef(new Date().toISOString());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Running volume total (weight × reps for all completed sets)
  const totalVolume = useMemo(() => {
    return state.exercises.reduce((sum, ex) => {
      return sum + ex.sets.reduce((setSum, s) => {
        if (!s.completed) return setSum;
        return setSum + (s.weight ?? 0) * (s.reps ?? 0);
      }, 0);
    }, 0);
  }, [state.exercises]);

  // PR detection
  const [newPRs, setNewPRs] = useState<Set<string>>(new Set());

  // Per-exercise notes
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    startSession().catch(() => undefined);
    return () => {
      AsyncStorage.removeItem(DRAFT_KEY).catch(() => undefined);
    };
  }, []);

  // Persist draft after every set change
  useEffect(() => {
    if (completedSets === 0) return;
    AsyncStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        programId: program.id,
        programName: program.name,
        startedAt: sessionStartTime.current,
        completedSets,
      }),
    ).catch(() => undefined);
  }, [completedSets, program.id, program.name]);

  useEffect(() => {
    if (state.isComplete) {
      AsyncStorage.removeItem(DRAFT_KEY).catch(() => undefined);
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

  async function handleSetComplete(weight: number, reps: number, rpe: number) {
    const ex = program.days[0]?.exercises[state.currentExerciseIndex];
    const rest = ex?.restSeconds ?? DEFAULT_REST_SECONDS;
    setRestDuration(rest);
    setShowRestTimer(true);

    // PR detection — check after completing a set with weight
    if (weight > 0 && currentExercise) {
      const exerciseId = currentExercise.exerciseId;
      getPersonalRecord(exerciseId)
        .then((pr) => {
          if (pr === null || weight > pr.weight) {
            setNewPRs((prev) => new Set(prev).add(exerciseId));
          }
        })
        .catch(() => undefined);
    }

    completeSet();
  }

  const currentExerciseId = currentExercise.exerciseId;
  const hasPR = newPRs.has(currentExerciseId);

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => {
          AsyncStorage.removeItem(DRAFT_KEY).catch(() => undefined);
          navigation.goBack();
        }}
        className="mb-6"
      >
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text className="text-white text-h2 font-heading">{currentExercise.exerciseName}</Text>
          {hasPR && (
            <View style={{ backgroundColor: 'rgba(239,191,4,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 12 }}>🏆 PR!</Text>
            </View>
          )}
        </View>
        {/* Stats row: sets · timer · volume */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text className="text-white/30 text-caption font-body">
            {completedSets} / {totalSets} sets terminés
          </Text>
          <Text className="text-white/30 text-caption font-body">
            ⏱ {formatTime(elapsedSeconds)}
          </Text>
          {totalVolume > 0 && (
            <Text className="text-white/30 text-caption font-body">
              ⚡ {totalVolume}kg
            </Text>
          )}
        </View>
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

      {/* Notes per exercise */}
      <View className="mb-6">
        <TextInput
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#fff',
            fontFamily: 'Rowan-Regular',
            fontSize: 13,
          }}
          placeholder="Note pour cet exercice..."
          placeholderTextColor="#a0a0a0"
          multiline
          value={exerciseNotes[currentExerciseId] ?? ''}
          onChangeText={(text) =>
            setExerciseNotes((prev) => ({ ...prev, [currentExerciseId]: text }))
          }
        />
      </View>

      {/* Progress indicator */}
      <View className="bg-white/[0.02] rounded-2xl p-4 items-center">
        <Text className="text-white/40 text-caption font-body">
          {completedSets} / {totalSets} sets · Exercice {state.currentExerciseIndex + 1}/{state.exercises.length}
        </Text>
      </View>
    </ScrollView>
  );
}
