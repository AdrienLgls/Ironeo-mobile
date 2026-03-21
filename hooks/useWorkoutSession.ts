import { useState, useCallback, useRef } from 'react';
import type { ProgramDetail, SessionExercise, WorkoutSet } from '../types/workout';
import { createWorkoutSession, updateWorkoutSession } from '../services/workoutService';

interface SessionState {
  sessionId: string | null;
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercises: SessionExercise[];
  isComplete: boolean;
}

function buildExercises(program: ProgramDetail, dayIndex: number): SessionExercise[] {
  const day = program.days[dayIndex] ?? program.days[0];
  if (!day) return [];
  return day.exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    sets: Array.from({ length: ex.sets }, () => ({
      reps: typeof ex.reps === 'number' ? ex.reps : 0,
      weight: undefined,
      completed: false,
    })),
  }));
}

export function useWorkoutSession(program: ProgramDetail) {
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    exercises: buildExercises(program, 0),
    isComplete: false,
  });

  const sessionIdRef = useRef<string | null>(null);

  const startSession = useCallback(async () => {
    const session = await createWorkoutSession(program.id);
    sessionIdRef.current = session.id;
    setState((prev) => ({ ...prev, sessionId: session.id }));
  }, [program.id]);

  const completeSet = useCallback(async () => {
    let updatedExercises: SessionExercise[] = [];

    setState((prev) => {
      const exercises = prev.exercises.map((ex, exIdx) => {
        if (exIdx !== prev.currentExerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) =>
            sIdx === prev.currentSetIndex ? { ...s, completed: true } : s
          ),
        };
      });

      updatedExercises = exercises;

      const currentEx = exercises[prev.currentExerciseIndex];
      const nextSetIdx = prev.currentSetIndex + 1;
      const allSetsOfExDone = currentEx
        ? nextSetIdx >= currentEx.sets.length
        : true;

      let nextExIdx = prev.currentExerciseIndex;
      let nextSetIndex = nextSetIdx;

      if (allSetsOfExDone) {
        nextExIdx = prev.currentExerciseIndex + 1;
        nextSetIndex = 0;
      }

      const isComplete = nextExIdx >= exercises.length;

      return {
        ...prev,
        exercises,
        currentExerciseIndex: isComplete ? prev.currentExerciseIndex : nextExIdx,
        currentSetIndex: isComplete ? prev.currentSetIndex : nextSetIndex,
        isComplete,
      };
    });

    if (sessionIdRef.current) {
      await updateWorkoutSession(sessionIdRef.current, {
        exercises: updatedExercises,
      }).catch(() => undefined);
    }
  }, []);

  const currentExercise = state.exercises[state.currentExerciseIndex] ?? null;
  const currentSet = currentExercise?.sets[state.currentSetIndex] ?? null;
  const totalSets = state.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = state.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  return {
    state,
    startSession,
    completeSet,
    currentExercise,
    currentSet,
    progress: totalSets > 0 ? completedSets / totalSets : 0,
    completedSets,
    totalSets,
  };
}
