import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  startTimerNotification,
  updateTimerNotification,
  stopTimerNotification,
} from '../../services/timerNotificationService';

interface Props {
  durationSeconds: number;
  exerciseName?: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function RestTimer({ durationSeconds, exerciseName = 'Workout', onComplete, onSkip }: Props) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(durationSeconds);

  useEffect(() => {
    setRemaining(durationSeconds);
    remainingRef.current = durationSeconds;
    startTimerNotification(durationSeconds, exerciseName).catch(() => undefined);
  }, [durationSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      stopTimerNotification().catch(() => undefined);
      onComplete();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        remainingRef.current = next;
        updateTimerNotification(next, exerciseName).catch(() => undefined);
        if (next <= 0 && intervalRef.current) clearInterval(intervalRef.current);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopTimerNotification().catch(() => undefined);
    };
  }, [durationSeconds]);

  const progress = 1 - remaining / durationSeconds;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <View className="bg-white/[0.05] rounded-2xl p-6 items-center mb-6">
      <Text className="text-white/50 text-xs uppercase tracking-wider mb-3">Rest</Text>
      <Text className="text-accent text-5xl font-bold mb-4">{label}</Text>
      <View className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mb-4">
        <View
          className="h-full bg-accent rounded-full"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>
      <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
        <Text className="text-white/40 text-sm">Skip rest →</Text>
      </TouchableOpacity>
    </View>
  );
}
