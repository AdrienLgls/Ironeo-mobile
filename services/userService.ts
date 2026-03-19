import api from './api';
import type { UserStats, RecentSession } from '../types/user';

export async function getUserStats(): Promise<UserStats> {
  const { data } = await api.get<UserStats>('/users/stats');
  return data;
}

export async function getRecentSessions(): Promise<RecentSession[]> {
  const { data } = await api.get<RecentSession[]>('/workouts/recent');
  return data;
}
