import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Program } from '../../types/workout';

interface Props {
  program: Program;
  onPress: () => void;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: 'rgba(34,197,94,0.2)',   text: '#22c55e' },
  intermediate: { bg: 'rgba(245,158,11,0.2)',  text: '#f59e0b' },
  advanced:     { bg: 'rgba(239,68,68,0.2)',   text: '#ef4444' },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner:     'Débutant',
  intermediate: 'Intermédiaire',
  advanced:     'Avancé',
};

export default function ProgramCard({ program, onPress }: Props) {
  const difficulty = program.level ? DIFFICULTY_COLORS[program.level] : null;
  const difficultyLabel = program.level ? (DIFFICULTY_LABEL[program.level] ?? program.level) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
      }}
    >
      {/* Top row: title + play button */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text
          style={{
            flex: 1,
            color: '#ffffff',
            fontFamily: 'Quilon-Medium',
            fontSize: 16,
            lineHeight: 22,
            marginRight: 12,
          }}
          numberOfLines={2}
        >
          {program.name}
        </Text>

        {/* Play button */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#EFBF04',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#000', fontSize: 14, marginLeft: 2 }}>{'▶'}</Text>
        </View>
      </View>

      {/* Description */}
      {program.description ? (
        <Text
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Rowan-Regular',
            fontSize: 13,
            lineHeight: 18,
            marginBottom: 12,
          }}
          numberOfLines={2}
        >
          {program.description}
        </Text>
      ) : null}

      {/* Bottom row: badges */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {difficulty && difficultyLabel ? (
          <View
            style={{
              backgroundColor: difficulty.bg,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: difficulty.text, fontFamily: 'Rowan-Regular', fontSize: 12 }}>
              {difficultyLabel}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12 }}>{'🗓'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
            {program.daysPerWeek} séances/sem
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12 }}>{'⏱'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
            {program.durationWeeks} semaines
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
