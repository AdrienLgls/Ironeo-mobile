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
