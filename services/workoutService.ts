import api from './api';
import type { Program, Exercise, WorkoutSession, CreateCustomExerciseInput } from '../types/workout';

export async function getPrograms(): Promise<Program[]> {
  const { data } = await api.get<Program[]>('/programs');
  return data;
}

export async function getProgramById(id: string): Promise<Program> {
  const { data } = await api.get<Program>(`/programs/${id}`);
  return data;
}

export async function getExercises(): Promise<Exercise[]> {
  const { data } = await api.get<Exercise[]>('/exercises');
  return data;
}

export async function getExerciseById(id: string): Promise<Exercise> {
  const { data } = await api.get<Exercise>(`/exercises/${id}`);
  return data;
}

export async function createWorkoutSession(programId: string): Promise<WorkoutSession> {
  const { data } = await api.post<WorkoutSession>('/sessions', { programId });
  return data;
}

export async function updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession> {
  const { data } = await api.patch<WorkoutSession>(`/sessions/${id}`, updates);
  return data;
}

export async function getProgramDetail(id: string): Promise<import('../types/workout').ProgramDetail> {
  const { data } = await api.get<import('../types/workout').ProgramDetail>(`/programs/${id}`);
  return data;
}

export async function getWorkoutSessions(page = 1, limit = 20): Promise<WorkoutSession[]> {
  const { data } = await api.get<WorkoutSession[]>(`/sessions?page=${page}&limit=${limit}`);
  return data;
}

export interface WeeklyStats {
  weekStart: string;
  totalVolume?: number;
  sessions?: number;
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
}

export async function getVolumeStats(weeks = 12): Promise<WeeklyStats[]> {
  try {
    const { data } = await api.get<WeeklyStats[]>(`/stats/volume?weeks=${weeks}`);
    return data || [];
  } catch {
    return [];
  }
}

export async function getSessionsStats(weeks = 12): Promise<WeeklyStats[]> {
  try {
    const { data } = await api.get<WeeklyStats[]>(`/stats/sessions?weeks=${weeks}`);
    return data || [];
  } catch {
    return [];
  }
}

export async function getPersonalRecord(exerciseId: string): Promise<PersonalRecord | null> {
  try {
    const { data } = await api.get<PersonalRecord>(`/exercises/${exerciseId}/personal-record`);
    return data || null;
  } catch {
    return null;
  }
}

export async function getSessionById(id: string): Promise<WorkoutSession & { exercises?: unknown[] }> {
  const { data } = await api.get<WorkoutSession & { exercises?: unknown[] }>(`/sessions/${id}`);
  return data;
}

export interface FollowedProgramEntry {
  _id: string;
  program: { _id: string; name: string };
  isActive: boolean;
}

export async function getFollowedPrograms(): Promise<FollowedProgramEntry[]> {
  const { data } = await api.get<FollowedProgramEntry[]>('/programs/user/followed');
  return data;
}

export async function unfollowProgram(id: string): Promise<void> {
  await api.delete(`/programs/${id}/follow`);
}

export async function createCustomExercise(input: CreateCustomExerciseInput): Promise<Exercise> {
  const { data } = await api.post<Exercise>('/exercises', {
    name: input.name,
    category: input.muscleGroup,
    primaryMuscles: [input.muscleGroup],
    equipment: input.equipment ?? 'Poids corps',
    description: input.description,
  });
  return data;
}

export async function deleteCustomExercise(id: string): Promise<void> {
  await api.delete(`/exercises/${id}`);
}

export interface SessionPatch {
  notes?: string;
  rpe?: number;
}

export async function updateSession(id: string, patch: SessionPatch): Promise<WorkoutSession> {
  const { data } = await api.put<WorkoutSession>(`/sessions/${id}`, patch);
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/sessions/${id}`);
}

export interface ExerciseHistoryEntry {
  date: string;
  maxWeight: number;
  totalVolume: number;
  sets: number;
}

export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
  try {
    const { data } = await api.get<{
      chartData: { topSet: Array<{ date: string; weight: number; reps: number }> };
      entries: Array<{ date: string; totalVolume: number; sets: Array<{ completed: boolean }> }>;
    }>(`/sessions/exercise/${exerciseId}/history?limit=50`);

    const topSetData = data.chartData?.topSet ?? [];
    const entries = data.entries ?? [];

    return topSetData.map((point, i) => ({
      date: point.date,
      maxWeight: point.weight,
      totalVolume: entries[i]?.totalVolume ?? 0,
      sets: (entries[i]?.sets ?? []).filter((s) => s.completed).length,
    }));
  } catch {
    return [];
  }
}
