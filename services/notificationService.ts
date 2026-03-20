import api from './api';

export interface Notification {
  _id: string;
  type: 'friend_request' | 'friend_accepted' | 'group_invite' | 'badge_earned' | 'streak_milestone' | 'workout_friend' | 'level_up';
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const { data } = await api.get<Notification[]>('/notifications');
    return data || [];
  } catch {
    return [];
  }
}

export async function markAsRead(notifId: string): Promise<void> {
  await api.put(`/notifications/${notifId}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}

export async function getUnreadCount(): Promise<number> {
  try {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  } catch {
    return 0;
  }
}

export async function registerPushToken(token: string, platform: string): Promise<void> {
  await api.post('/notifications/push-token', { token, platform });
}
