import api from './api';

export interface Friend {
  _id: string;
  pseudo: string;
  avatar?: string;
  level?: number;
  xp?: number;
}

export interface FriendRequest {
  _id: string;
  from: Friend;
  createdAt: string;
}

export interface ActivityItem {
  _id: string;
  userId: string;
  userPseudo: string;
  userAvatar?: string;
  userLevel?: number;
  type: 'workout_completed' | 'personal_record' | 'streak_milestone' | 'badge_earned' | 'article_finished' | 'parcours_completed' | 'member_joined';
  data: Record<string, unknown>;
  bravoCount: number;
  hasBravoed: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  pseudo: string;
  avatar?: string;
  level?: number;
  score: number;
  rankChange?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  myRank?: LeaderboardEntry;
  isLocked: boolean;
}

export async function getFriends(): Promise<Friend[]> {
  try {
    const { data } = await api.get<Friend[]>('/friends');
    return data || [];
  } catch {
    return [];
  }
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  try {
    const { data } = await api.get<FriendRequest[]>('/friends/requests');
    return data || [];
  } catch {
    return [];
  }
}

export async function sendFriendRequest(userId: string): Promise<void> {
  await api.post('/friends/request', { userId });
}

export async function acceptFriendRequest(userId: string): Promise<void> {
  await api.put(`/friends/accept/${userId}`);
}

export async function rejectFriendRequest(userId: string): Promise<void> {
  await api.put(`/friends/reject/${userId}`);
}

export async function removeFriend(userId: string): Promise<void> {
  await api.delete(`/friends/${userId}`);
}

export async function searchUsers(query: string): Promise<Friend[]> {
  try {
    const { data } = await api.get<Friend[]>(`/users/search?q=${query}`);
    return data || [];
  } catch {
    return [];
  }
}

export async function getUserProfile(userId: string): Promise<unknown> {
  try {
    const { data } = await api.get<unknown>(`/users/${userId}/profile`);
    return data;
  } catch {
    return null;
  }
}

export async function getActivityFeed(page?: number): Promise<ActivityItem[]> {
  try {
    const url = page !== undefined ? `/activity/feed?page=${page}` : '/activity/feed';
    const { data } = await api.get<ActivityItem[]>(url);
    return data || [];
  } catch {
    return [];
  }
}

export async function sendBravo(activityId: string): Promise<void> {
  await api.post(`/activity/${activityId}/bravo`);
}

export async function getLeaderboard(
  type: 'consistency' | 'volume' | 'power',
  period: 'weekly' | 'monthly' | 'alltime',
): Promise<LeaderboardResponse> {
  const { data } = await api.get<LeaderboardResponse>(`/leaderboards/global/${type}/${period}`);
  return data;
}
