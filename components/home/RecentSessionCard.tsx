import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { RecentSession } from '../../types/user';

interface Props {
  session: RecentSession;
  onPress: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function RecentSessionCard({ session, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white/[0.05] rounded-2xl p-4"
    >
      <Text className="text-white/50 text-xs mb-1">Last session</Text>
      <Text className="text-white font-semibold text-base">{session.programName}</Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-white/40 text-xs">{formatDate(session.date)}</Text>
        <Text className="text-accent text-xs font-medium">{session.durationMinutes} min</Text>
      </View>
    </TouchableOpacity>
  );
}
