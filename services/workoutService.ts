import api from './api';
import type { Program, Exercise, WorkoutSession } from '../types/workout';

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
  const { data } = await api.post<WorkoutSession>('/workout-sessions', { programId });
  return data;
}

export async function updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession> {
  const { data } = await api.patch<WorkoutSession>(`/workout-sessions/${id}`, updates);
  return data;
}

export async function getProgramDetail(id: string): Promise<import('../types/workout').ProgramDetail> {
  const { data } = await api.get<import('../types/workout').ProgramDetail>(`/programs/${id}`);
  return data;
}

export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
  const { data } = await api.get<WorkoutSession[]>('/workout-sessions');
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
  const { data } = await api.get<WorkoutSession & { exercises?: unknown[] }>(`/workout-sessions/${id}`);
  return data;
}
