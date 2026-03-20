import api from './api';
import type { ActivityItem } from './socialService';

// ─── Chat types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  _id: string;
  text: string;
  user: {
    _id: string;
    pseudo: string;
    avatar?: string;
  };
  createdAt: string;
  replyTo?: {
    _id: string;
    text: string;
    userName: string;
  };
  reactions?: Array<{ emoji: string; users: string[] }>;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  memberCount: number;
  userRole?: 'admin' | 'member' | null;
  code?: string;
}

export interface GroupMember {
  _id: string;
  pseudo: string;
  avatar?: string;
  level?: number;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
  about?: string;
}

export async function getMyGroups(): Promise<Group[]> {
  try {
    const { data } = await api.get<Group[]>('/groups');
    return data || [];
  } catch {
    return [];
  }
}

export async function discoverGroups(): Promise<Group[]> {
  try {
    const { data } = await api.get<Group[]>('/groups/discover');
    return data || [];
  } catch {
    return [];
  }
}

export async function joinGroupByCode(code: string): Promise<void> {
  await api.post(`/groups/join/${code}`);
}

export async function requestJoinGroup(groupId: string): Promise<void> {
  await api.post(`/groups/${groupId}/request`);
}

export async function createGroup(data: {
  name: string;
  description?: string;
  isPublic: boolean;
}): Promise<Group> {
  const { data: result } = await api.post<Group>('/groups', data);
  return result;
}

export async function leaveGroup(groupId: string): Promise<void> {
  await api.post(`/groups/${groupId}/leave`);
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail | null> {
  try {
    const { data } = await api.get<GroupDetail>(`/groups/${groupId}`);
    return data;
  } catch {
    return null;
  }
}

export async function getGroupActivity(groupId: string): Promise<ActivityItem[]> {
  try {
    const { data } = await api.get<ActivityItem[]>(`/groups/${groupId}/activity`);
    return data || [];
  } catch {
    return [];
  }
}

// ─── Chat functions ───────────────────────────────────────────────────────────

export async function getMessages(
  groupId: string,
  limit = 30,
  before?: string,
): Promise<ChatMessage[]> {
  const params: Record<string, string | number> = { limit };
  if (before) params.before = before;
  const { data } = await api.get<ChatMessage[]>(`/groups/${groupId}/messages`, { params });
  return data;
}

export async function sendMessage(
  groupId: string,
  text: string,
  replyTo?: string,
): Promise<ChatMessage> {
  const body: Record<string, string> = { text };
  if (replyTo) body.replyTo = replyTo;
  const { data } = await api.post<ChatMessage>(`/groups/${groupId}/messages`, body);
  return data;
}

export async function deleteMessage(groupId: string, messageId: string): Promise<void> {
  await api.delete(`/groups/${groupId}/messages/${messageId}`);
}

export async function reactToMessage(
  groupId: string,
  messageId: string,
  emoji: string,
): Promise<void> {
  await api.post(`/groups/${groupId}/messages/${messageId}/react`, { emoji });
}
