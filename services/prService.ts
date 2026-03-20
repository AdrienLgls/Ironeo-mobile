import api from './api';
import type { WorkoutSession } from '../types/workout';

export type PRType = 'maxWeight' | 'estimated1RM' | 'maxRepsAtWeight';

export interface PRResult {
  exerciseName: string;
  exerciseId: string;
  type: PRType;
  value: number;
  previousValue: number;
  improvement: number;
  unit: string;
}

interface CheckPRsPayload {
  exerciseId: string;
  weight: number;
  reps: number;
  unit: 'kg' | 'lb';
}

interface CheckPRsResponse {
  prs: Array<{
    type: PRType;
    value: number;
    previousValue: number;
    improvement: number;
    unit: string;
  }>;
}

export async function checkPRs(session: WorkoutSession): Promise<PRResult[]> {
  const results: PRResult[] = [];

  for (const exercise of session.exercises) {
    const completedSets = exercise.sets.filter(
      (s) => s.completed && (s.weight ?? 0) > 0 && (s.reps ?? 0) > 0
    );

    for (const set of completedSets) {
      const payload: CheckPRsPayload = {
        exerciseId: exercise.exerciseId,
        weight: set.weight ?? 0,
        reps: set.reps,
        unit: 'kg',
      };

      try {
        const { data } = await api.post<CheckPRsResponse>('/workout-sessions/check-prs', payload);
        for (const pr of data.prs) {
          // Deduplicate: keep only the best improvement per exercise+type
          const existing = results.findIndex(
            (r) => r.exerciseId === exercise.exerciseId && r.type === pr.type
          );
          if (existing === -1) {
            results.push({
              exerciseName: exercise.exerciseName,
              exerciseId: exercise.exerciseId,
              ...pr,
            });
          } else if (pr.improvement > results[existing].improvement) {
            results[existing] = {
              exerciseName: exercise.exerciseName,
              exerciseId: exercise.exerciseId,
              ...pr,
            };
          }
        }
      } catch {
        // Silently skip failed checks — PRs are non-critical
      }
    }
  }

  return results;
}
