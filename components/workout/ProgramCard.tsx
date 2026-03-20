import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Program } from '../../types/workout';

interface Props {
  program: Program;
  onPress: () => void;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function ProgramCard({ program, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white/[0.05] rounded-2xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-start">
        <Text className="text-white font-semibold text-base flex-1 mr-2">{program.name}</Text>
        {program.level && (
          <View className="bg-accent/20 rounded-lg px-2 py-0.5">
            <Text className="text-accent text-xs font-medium">{LEVEL_LABEL[program.level] ?? program.level}</Text>
          </View>
        )}
      </View>
      {program.description && (
        <Text className="text-white/40 text-xs mt-1" numberOfLines={2}>{program.description}</Text>
      )}
      <View className="flex-row gap-4 mt-3">
        <Text className="text-white/50 text-xs">{program.daysPerWeek}×/week</Text>
        <Text className="text-white/50 text-xs">{program.durationWeeks} weeks</Text>
      </View>
    </TouchableOpacity>
  );
}
