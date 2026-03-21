import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ActivityItem } from '../services/socialService';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function getActivityDescription(item: ActivityItem): string {
  const d = item.data;
  switch (item.type) {
    case 'workout_completed':
      return `A terminé une séance · ${String(d.programName ?? '')} · ${String(d.sets ?? '')} sets · ${String(d.volume ?? '')}kg`;
    case 'personal_record':
      return `A battu un record 🏆 · ${String(d.exerciseName ?? '')} · ${String(d.weight ?? '')}kg`;
    case 'streak_milestone':
      return `🔥 ${String(d.days ?? '')} jours consécutifs!`;
    case 'badge_earned':
      return `A obtenu le badge · ${String(d.badgeName ?? '')}`;
    case 'article_finished':
      return `A terminé l'article · ${String(d.articleTitle ?? '')}`;
    case 'parcours_completed':
      return `A complété le parcours · ${String(d.parcoursTitle ?? '')}`;
    case 'member_joined':
      return `A rejoint le groupe · ${String(d.groupName ?? '')}`;
  }
}

export function getTypeIcon(type: ActivityItem['type']): { name: IoniconName; color: string } {
  switch (type) {
    case 'workout_completed':
      return { name: 'barbell', color: '#fafafa' };
    case 'personal_record':
      return { name: 'trophy', color: '#EFBF04' };
    case 'streak_milestone':
      return { name: 'flame', color: '#f97316' };
    case 'badge_earned':
      return { name: 'ribbon', color: '#a855f7' };
    case 'article_finished':
      return { name: 'book', color: '#3b82f6' };
    case 'parcours_completed':
      return { name: 'checkmark-circle', color: '#22c55e' };
    case 'member_joined':
      return { name: 'people', color: '#6366f1' };
  }
}
