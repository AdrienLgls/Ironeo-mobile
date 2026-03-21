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

export interface FollowedProgram {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  sessionsPerWeek?: number;
  level?: string;
}

export interface DueReview {
  _id: string;
  articleId: string;
  slug?: string;
  title?: string;
  dueDate: string;
}

export interface ActiveSessionInfo {
  _id: string;
  programId?: string;
  programName?: string;
  exerciseCount?: number;
  startedAt: string;
  status: string;
}

export interface PointsData {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXP: number;
  rank?: string;
}

export async function getFollowedPrograms(): Promise<FollowedProgram[]> {
  try {
    const { data } = await api.get<FollowedProgram[]>('/programs/user/followed');
    return data || [];
  } catch {
    return [];
  }
}

export async function getDueReviews(): Promise<DueReview[]> {
  try {
    const { data } = await api.get<{ reviews: DueReview[] }>('/quiz/reviews/due');
    return data?.reviews || [];
  } catch {
    return [];
  }
}

export async function getActiveSession(): Promise<ActiveSessionInfo | null> {
  try {
    const { data } = await api.get<ActiveSessionInfo>('/sessions/active');
    return data || null;
  } catch {
    return null;
  }
}

export async function getPoints(): Promise<PointsData | null> {
  try {
    const { data } = await api.get<PointsData>('/points/me');
    return data || null;
  } catch {
    return null;
  }
}

export async function getTodaySession(): Promise<{ completed: boolean; programName?: string } | null> {
  try {
    const { data } = await api.get<{ completed: boolean; programName?: string }>('/sessions/today');
    return data || null;
  } catch {
    return null;
  }
}

export interface YearInReview {
  year: number;
  totalWorkouts: number;
  trainingDays: number;
  totalPRs: number;
  bestStreak: number;
  totalVolume: number; // kg
  totalDuration: number; // minutes
  totalSets: number;
  heaviestWeight: number; // kg
  monthlyWorkouts: number[]; // array of 12
  bestMonth: number; // 0-11 index
  bestMonthWorkouts: number;
  articlesRead: number;
  articlesMastered: number;
  badgesEarned: number;
  totalPoints: number;
  level: number;
}

export async function getYearInReview(): Promise<YearInReview | null> {
  try {
    const { data } = await api.get<YearInReview>('/profile/me/year-in-review');
    return data;
  } catch {
    return null;
  }
}

export interface UpdateProfilePayload {
  pseudo?: string;
  bio?: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  await api.put('/profile/me', payload);
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/profile/me');
}

export async function uploadAvatar(uri: string): Promise<void> {
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('image', { uri, name: filename, type } as unknown as Blob);
  await api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
