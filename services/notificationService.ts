import * as Notifications from 'expo-notifications';
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
  try {
    await api.put(`/notifications/${notifId}/read`);
  } catch (err) {
    throw err;
  }
}

export async function markAllAsRead(): Promise<void> {
  try {
    await api.put('/notifications/read-all');
  } catch (err) {
    throw err;
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    const count = data.count;
    await Notifications.setBadgeCountAsync(count);
    return count;
  } catch {
    return 0;
  }
}

export async function registerPushToken(token: string, platform: string): Promise<void> {
  await api.post('/notifications/push-token', { token, platform });
}
