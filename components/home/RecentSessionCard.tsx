import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatDate } from '../../utils/formatters';
import type { RecentSession } from '../../types/user';

interface Props {
  session: RecentSession;
  onPress: () => void;
}

export default function RecentSessionCard({ session, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white/[0.05] rounded-2xl p-4"
    >
      <Text className="text-white/50 text-caption font-body mb-1">Last session</Text>
      <Text className="text-white text-body font-heading">{session.programName}</Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-white/40 text-caption font-body">{formatDate(session.date)}</Text>
        <Text className="text-accent text-caption font-body">{session.durationMinutes} min</Text>
      </View>
    </TouchableOpacity>
  );
}
