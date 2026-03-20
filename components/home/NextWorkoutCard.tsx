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
          <Text className="text-white/50 text-caption font-body mb-1">Next workout</Text>
          <Text className="text-white text-body font-heading">{nextWorkout.programName}</Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-white/40 text-caption font-body">{nextWorkout.dayLabel}</Text>
            <View className="bg-accent rounded-xl px-3 py-1">
              <Text className="text-black text-caption font-body">Start</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text className="text-white/50 text-caption font-body mb-1">Ready to train?</Text>
          <Text className="text-white text-body font-heading">Start a workout</Text>
          <View className="flex-row justify-end mt-2">
            <View className="bg-accent rounded-xl px-3 py-1">
              <Text className="text-black text-caption font-body">Go</Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}
