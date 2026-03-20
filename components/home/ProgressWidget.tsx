import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  currentWeight?: number;
  goalWeight?: number;
}

function calcProgress(current: number, goal: number, start: number): number {
  if (start === goal) return 1;
  const progress = (start - current) / (start - goal);
  return Math.min(Math.max(progress, 0), 1);
}

export default function ProgressWidget({ currentWeight, goalWeight }: Props) {
  if (!currentWeight || !goalWeight) return null;

  const losing = goalWeight < currentWeight;
  const startWeight = losing ? currentWeight + 5 : currentWeight - 5;
  const progress = calcProgress(currentWeight, goalWeight, startWeight);
  const pct = Math.round(progress * 100);

  return (
    <View className="bg-white/[0.05] rounded-2xl p-4 mb-4">
      <Text className="text-white/50 text-xs mb-3">Weight goal</Text>
      <View className="flex-row justify-between mb-2">
        <Text className="text-white font-semibold">{currentWeight} kg</Text>
        <Text className="text-white/40 text-sm">→ {goalWeight} kg</Text>
      </View>
      <View className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
        <View
          className="h-full bg-accent rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className="text-white/40 text-xs mt-2">{pct}% to goal</Text>
    </View>
  );
}
