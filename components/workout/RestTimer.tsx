import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 80;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SVG_SIZE = 220;
const CENTER = SVG_SIZE / 2;

function getTimerColor(remaining: number, total: number): string {
  if (total <= 0) return '#EFBF04';
  const ratio = remaining / total;
  if (remaining <= 3) return '#F87171';
  if (ratio <= 0.3) return '#FB923C';
  return '#EFBF04';
}

export default function RestTimer({ durationSeconds, exerciseName = 'Workout', onComplete, onSkip }: Props) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const arcAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setRemaining(durationSeconds);
    arcAnim.setValue(0);
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

  // Animate arc
  useEffect(() => {
    const targetProgress = durationSeconds > 0 ? (durationSeconds - remaining) / durationSeconds : 0;
    Animated.timing(arcAnim, {
      toValue: targetProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [remaining, durationSeconds]);

  const strokeDashoffset = arcAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const color = getTimerColor(remaining, durationSeconds);

  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      {/* SVG circular timer */}
      <View style={{ width: SVG_SIZE, height: SVG_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          {/* Background ring */}
          <Circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke="rgba(239, 191, 4, 0.12)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress arc */}
          <AnimatedCircle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </Svg>

        {/* Center content: countdown */}
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color, fontFamily: 'Quilon-Medium', fontSize: 48, lineHeight: 52 }}>
            {label}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 12, marginTop: 4 }}>
            REPOS
          </Text>
        </View>
      </View>

      {/* Exercise name */}
      {exerciseName !== 'Workout' && (
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 13, marginTop: 8, marginBottom: 4 }}>
          Prochain : {exerciseName}
        </Text>
      )}

      {/* Controls */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <TouchableOpacity
          onPress={onSkip}
          activeOpacity={0.7}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 13 }}>
            Passer →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
