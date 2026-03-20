import api from './api';
import type { UserStats, RecentSession, NextWorkout } from '../types/user';

export async function getUserStats(): Promise<UserStats> {
  const { data } = await api.get<UserStats>('/users/stats');
  return data;
}

export async function getRecentSessions(): Promise<RecentSession[]> {
  const { data } = await api.get<RecentSession[]>('/workouts/recent');
  return data;
}

export async function getNextWorkout(): Promise<NextWorkout | null> {
  try {
    const { data } = await api.get<NextWorkout>('/programs/next');
    return data;
  } catch {
    return null;
  }
}
