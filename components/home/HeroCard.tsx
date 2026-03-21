import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import type { ActiveSessionInfo, FollowedProgram } from '../../services/userService';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bonne après-midi';
  if (hour >= 18 && hour < 22) return 'Bonsoir';
  return 'Bonne nuit';
}

type UserState = 'active-session' | 'workout-completed' | 'workout-day' | 'rest-day' | 'new-user';

const STATE_BACKGROUND: Record<UserState, string> = {
  'active-session': 'rgba(249,115,22,0.15)',
  'workout-completed': 'rgba(16,185,129,0.12)',
  'workout-day': 'rgba(239,191,4,0.15)',
  'rest-day': 'rgba(99,102,241,0.08)',
  'new-user': 'rgba(255,255,255,0.04)',
};

const LEVEL_BADGE_BG: Record<UserState, string> = {
  'active-session': 'rgba(249,115,22,0.25)',
  'workout-completed': 'rgba(16,185,129,0.25)',
  'workout-day': 'rgba(239,191,4,0.20)',
  'rest-day': 'rgba(99,102,241,0.20)',
  'new-user': 'rgba(255,255,255,0.08)',
};

const LEVEL_BADGE_COLOR: Record<UserState, string> = {
  'active-session': '#f97316',
  'workout-completed': '#10b981',
  'workout-day': '#EFBF04',
  'rest-day': '#818cf8',
  'new-user': '#fafafa',
};

export interface HeroCardProps {
  userName: string;
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  onStartWorkout?: () => void;
  onResumeSession?: () => void;
  onLearn?: () => void;
  // Context data
  activeSession?: ActiveSessionInfo | null;
  workoutCompleted?: boolean;
  todaySession?: { programName?: string } | null;
  dueReviewsCount?: number;
  followedPrograms?: FollowedProgram[];
  tomorrowSession?: { programName?: string } | null;
}

export default function HeroCard({
  userName,
  level = 1,
  xp = 0,
  xpToNextLevel = 1000,
  onStartWorkout,
  onResumeSession,
  onLearn,
  activeSession,
  workoutCompleted,
  todaySession,
  dueReviewsCount = 0,
  followedPrograms,
  tomorrowSession,
}: HeroCardProps) {
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = userName.split(' ')[0];
  const xpPercent = Math.min(Math.round((xp / xpToNextLevel) * 100), 100);

  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(xpAnim, {
      toValue: xpPercent,
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [xpAnim, xpPercent]);

  const userState = useMemo<UserState>(() => {
    if (activeSession) return 'active-session';
    if (workoutCompleted) return 'workout-completed';
    if (todaySession) return 'workout-day';
    if (followedPrograms && followedPrograms.length > 0) return 'rest-day';
    return 'new-user';
  }, [activeSession, workoutCompleted, todaySession, followedPrograms]);

  const contextualMessage = useMemo(() => {
    switch (userState) {
      case 'active-session': {
        const count = activeSession?.exerciseCount ?? 0;
        return `Séance en cours — ${count} exercice${count > 1 ? 's' : ''}`;
      }
      case 'workout-completed':
        return 'Bravo, séance terminée ! 💪';
      case 'workout-day':
        return 'Séance prévue aujourd\'hui';
      case 'rest-day':
        return tomorrowSession?.programName
          ? `Jour de repos — Demain: ${tomorrowSession.programName}`
          : 'Jour de repos — Récupère bien';
      case 'new-user':
        return 'Découvre la Méthode Ironeo';
    }
  }, [userState, activeSession, tomorrowSession]);

  const bg = STATE_BACKGROUND[userState];
  const badgeBg = LEVEL_BADGE_BG[userState];
  const badgeColor = LEVEL_BADGE_COLOR[userState];

  return (
    <View style={{ backgroundColor: bg, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      {/* Header: greeting + level badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text className="text-white text-h2 font-heading" style={{ flex: 1 }}>
          {greeting},
        </Text>
        <View style={{ backgroundColor: badgeBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 }}>
          <Text style={{ color: badgeColor, fontSize: 12 }}>Niveau {level}</Text>
        </View>
      </View>

      {/* User name */}
      <Text className="text-white text-h3 font-heading" style={{ marginBottom: 4 }}>{firstName}</Text>

      {/* Contextual message */}
      <Text className="text-white/60 text-caption font-body" style={{ marginBottom: 16 }}>{contextualMessage}</Text>

      {/* XP bar */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text className="text-white/60 text-caption font-body">Progression</Text>
          <Text className="text-accent text-caption font-body">{xpPercent}%</Text>
        </View>
        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              width: xpAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: '#EFBF04',
              borderRadius: 2,
              shadowColor: '#EFBF04',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 4,
            }}
          />
        </View>
        <Text className="text-white/40 text-caption font-body" style={{ marginTop: 4 }}>{xp} / {xpToNextLevel} XP</Text>
      </View>

      {/* State-specific CTAs */}

      {/* active-session */}
      {userState === 'active-session' && (
        <TouchableOpacity
          onPress={onResumeSession}
          activeOpacity={0.85}
          style={{ backgroundColor: '#EFBF04', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text className="text-white text-body font-heading">Reprendre</Text>
        </TouchableOpacity>
      )}

      {/* workout-completed */}
      {userState === 'workout-completed' && (
        <View style={{ gap: 10 }}>
          {dueReviewsCount > 0 ? (
            <TouchableOpacity
              onPress={onLearn}
              activeOpacity={0.85}
              style={{ backgroundColor: '#EFBF04', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text className="text-white text-body font-heading">Réviser {dueReviewsCount} quiz</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onLearn}
              activeOpacity={0.85}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '500' }}>Continuer à apprendre</Text>
            </TouchableOpacity>
          )}
          {tomorrowSession?.programName && (
            <Text className="text-white/50 text-caption font-body" style={{ textAlign: 'center' }}>
              Demain : {tomorrowSession.programName}
            </Text>
          )}
        </View>
      )}

      {/* workout-day */}
      {userState === 'workout-day' && (
        <View style={{ gap: 8 }}>
          {todaySession?.programName && (
            <Text className="text-white text-body font-heading" style={{ marginBottom: 4 }}>
              {todaySession.programName}
            </Text>
          )}
          <TouchableOpacity
            onPress={onStartWorkout}
            activeOpacity={0.85}
            style={{ backgroundColor: '#EFBF04', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center' }}
          >
            <Text style={{ color: '#121212', fontSize: 16, fontWeight: '700' }}>Démarrer la séance</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* rest-day */}
      {userState === 'rest-day' && (
        <View style={{ gap: 10 }}>
          {dueReviewsCount > 0 ? (
            <TouchableOpacity
              onPress={onLearn}
              activeOpacity={0.85}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '500' }}>Réviser {dueReviewsCount} quiz</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onLearn}
              activeOpacity={0.85}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '500' }}>Continuer à apprendre</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* new-user */}
      {userState === 'new-user' && (
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={onStartWorkout}
            activeOpacity={0.85}
            style={{ backgroundColor: '#EFBF04', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#121212', fontSize: 16, fontWeight: '700' }}>Programmes Ironeo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onStartWorkout}
            activeOpacity={0.85}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '500' }}>Séance libre</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
