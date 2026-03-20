import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  userName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  onStartWorkout: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bonne après-midi';
  if (hour >= 18 && hour < 22) return 'Bonsoir';
  return 'Bonne nuit';
}

export default function HeroCard({ userName, level, xp, xpToNextLevel, onStartWorkout }: Props) {
  const greeting = useMemo(() => getGreeting(), []);
  const xpPercent = Math.min(Math.round((xp / xpToNextLevel) * 100), 100);
  const firstName = userName.split(' ')[0];

  return (
    <View
      style={{
        backgroundColor: 'rgba(239, 191, 4, 0.08)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {/* Header: greeting + level badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text className="text-white text-h2 font-heading" style={{ flex: 1 }}>
          {greeting},
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(239, 191, 4, 0.2)',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginLeft: 8,
          }}
        >
          <Text className="text-accent text-caption font-body">Niveau {level}</Text>
        </View>
      </View>

      {/* User name */}
      <Text className="text-white text-h3 font-heading mb-4">{firstName}</Text>

      {/* XP bar */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text className="text-white/60 text-caption font-body">Progression</Text>
          <Text className="text-accent text-caption font-body">{xpPercent}%</Text>
        </View>
        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${xpPercent}%`,
              backgroundColor: '#EFBF04',
              borderRadius: 2,
              shadowColor: '#EFBF04',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 4,
            }}
          />
        </View>
        <Text className="text-white/40 text-caption font-body mt-1">{xp} / {xpToNextLevel} XP</Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={onStartWorkout}
        activeOpacity={0.85}
        style={{
          backgroundColor: '#EFBF04',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
        }}
      >
        <Text className="text-background text-body font-heading">Démarrer la séance</Text>
      </TouchableOpacity>
    </View>
  );
}
