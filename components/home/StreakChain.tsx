import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, Animated } from 'react-native';

interface StreakDay {
  date: string;
  dayOfWeek: number;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface Props {
  currentStreak: number;
  last7Days?: StreakDay[];
}

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function TodayPulse({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={{ opacity: anim, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, borderWidth: 2, borderColor: '#EFBF04' }} />
  );
}

export default function StreakChain({ currentStreak, last7Days }: Props) {
  const days = useMemo((): StreakDay[] => {
    if (last7Days && last7Days.length === 7) return last7Days;

    const today = new Date();
    const todayIndex = 6;
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const daysAgo = 6 - i;
      return {
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay(),
        completed: daysAgo < currentStreak,
        isToday: i === todayIndex,
        isFuture: false,
      };
    });
  }, [last7Days, currentStreak]);

  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
      }}
    >
      {/* Streak counter */}
      {currentStreak > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
          <Text className="text-white text-h5 font-heading">{currentStreak}</Text>
          <Text className="text-white/50 text-body-sm font-body">
            jour{currentStreak > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Day labels */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {days.map((day, i) => (
          <React.Fragment key={`label-${i}`}>
            <View style={{ width: 28, alignItems: 'center' }}>
              <Text className="text-white/40 text-caption font-body">
                {DAY_LABELS[day.dayOfWeek]}
              </Text>
            </View>
            {i < 6 && <View style={{ width: 12 }} />}
          </React.Fragment>
        ))}
      </View>

      {/* Circles and connectors */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {days.map((day, i) => (
          <React.Fragment key={`day-${i}`}>
            <View style={{ width: 28, height: 28, position: 'relative' }}>
              {/* Circle background */}
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: day.isFuture
                    ? 'transparent'
                    : day.completed
                      ? '#EFBF04'
                      : 'rgba(255,255,255,0.1)',
                  borderWidth: day.isFuture ? 1 : 0,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {day.completed && (
                  <Text style={{ fontSize: 12, color: '#121212', fontWeight: '700' }}>✓</Text>
                )}
              </View>

              {/* Pulse ring on today */}
              {day.isToday && !day.completed && <TodayPulse>{null}</TodayPulse>}
              {day.isToday && day.completed && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }} />
              )}
            </View>

            {/* Connector */}
            {i < 6 && (
              <View
                style={{
                  width: 12,
                  height: 2,
                  backgroundColor: (day.completed && days[i + 1]?.completed)
                    ? '#EFBF04'
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EFBF04' }} />
          <Text className="text-white/40 text-caption font-body">Séance</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <Text className="text-white/40 text-caption font-body">Manqué</Text>
        </View>
      </View>
    </View>
  );
}
