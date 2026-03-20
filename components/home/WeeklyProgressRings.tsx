import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const RING_SIZE = 80;
const RADIUS = 32;
const STROKE_WIDTH = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RingProps {
  value: number;
  goal: number;
  label: string;
  unit: string;
  color: string;
  bgColor: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ value, goal, label, unit, color, bgColor }: RingProps) {
  const progress = Math.min(1, goal > 0 ? value / goal : 0);
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress, animProgress]);

  const strokeDashoffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ width: RING_SIZE, height: RING_SIZE, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 80 80">
          {/* Background ring */}
          <Circle
            cx="40" cy="40" r={RADIUS}
            fill="none"
            stroke={bgColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
          {/* Progress ring */}
          <AnimatedCircle
            cx="40" cy="40" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 40 40)"
          />
        </Svg>
        {/* Center text */}
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Quilon-Medium', lineHeight: 16 }}>
            {value}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Rowan-Regular' }}>
            /{goal}
          </Text>
        </View>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Rowan-Regular', marginTop: 6, textAlign: 'center' }}>
        {label}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Rowan-Regular', textAlign: 'center' }}>
        {unit}
      </Text>
    </View>
  );
}

interface WeeklyProgressRingsProps {
  sessions: number;
  sessionsGoal: number;
  volumeKg: number;
  volumeGoal: number;
  intensity: number;
  intensityGoal: number;
}

export default function WeeklyProgressRings({
  sessions,
  sessionsGoal,
  volumeKg,
  volumeGoal,
  intensity,
  intensityGoal,
}: WeeklyProgressRingsProps) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Rowan-Regular', marginBottom: 16 }}>
        Progression hebdomadaire
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <ProgressRing
          value={sessions}
          goal={sessionsGoal}
          label="Séances"
          unit="sessions"
          color="#EFBF04"
          bgColor="rgba(239,191,4,0.15)"
        />
        <ProgressRing
          value={volumeKg}
          goal={volumeGoal}
          label="Volume"
          unit="tonnes"
          color="#3B82F6"
          bgColor="rgba(59,130,246,0.15)"
        />
        <ProgressRing
          value={intensity}
          goal={intensityGoal}
          label="Intensité"
          unit="avg RPE"
          color="#8B5CF6"
          bgColor="rgba(139,92,246,0.15)"
        />
      </View>
    </View>
  );
}
