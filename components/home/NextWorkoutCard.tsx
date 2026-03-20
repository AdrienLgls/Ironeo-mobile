import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface NextWorkout {
  programName: string;
  dayLabel: string;
}

interface Props {
  nextWorkout: NextWorkout | null;
  onStart: () => void;
}

export default function NextWorkoutCard({ nextWorkout, onStart }: Props) {
  return (
    <TouchableOpacity
      onPress={onStart}
      activeOpacity={0.7}
      className="bg-white/[0.05] rounded-2xl p-4 mb-4"
    >
      {nextWorkout ? (
        <>
          <Text className="text-white/50 text-xs mb-1">Next workout</Text>
          <Text className="text-white font-semibold text-base">{nextWorkout.programName}</Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-white/40 text-xs">{nextWorkout.dayLabel}</Text>
            <View className="bg-accent rounded-xl px-3 py-1">
              <Text className="text-black text-xs font-bold">Start</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text className="text-white/50 text-xs mb-1">Ready to train?</Text>
          <Text className="text-white font-semibold text-base">Start a workout</Text>
          <View className="flex-row justify-end mt-2">
            <View className="bg-accent rounded-xl px-3 py-1">
              <Text className="text-black text-xs font-bold">Go</Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}
