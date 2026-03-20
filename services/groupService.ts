import api from './api';
import type { ActivityItem } from './socialService';

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
