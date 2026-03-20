import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';

interface DayData {
  date: string;
  count: number;
  isFuture: boolean;
}

interface Props {
  activityData?: Record<string, number>; // date → count
  maxWeeks?: number;
}

const CELL_SIZE = 10;
const GAP = 2;
const DAY_LABELS = ['L', '', 'M', '', 'V', '', 'D'];

function buildGrid(activityData: Record<string, number>, maxWeeks: number): DayData[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysBack = (maxWeeks - 1) * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - daysBack);

  // Align to Monday
  const startDay = start.getDay();
  const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
  start.setDate(start.getDate() + mondayOffset);

  const weeks: DayData[][] = [];
  const current = new Date(start);

  while (current <= today) {
    const week: DayData[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0];
      const isFuture = current > today;
      week.push({ date: dateStr, count: isFuture ? -1 : (activityData[dateStr] ?? 0), isFuture });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getCellColor(day: DayData): string {
  if (day.isFuture) return 'transparent';
  if (day.count === 0) return 'rgba(255,255,255,0.04)';
  if (day.count >= 3) return '#EFBF04';
  if (day.count >= 2) return '#D4A804';
  return '#8B6C02';
}

export default function ActivityHeatmap({ activityData = {}, maxWeeks = 26 }: Props) {
  const weeks = useMemo(() => buildGrid(activityData, maxWeeks), [activityData, maxWeeks]);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 12, marginBottom: 8 }}>
        Activité
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {/* Day labels column */}
          <View style={{ gap: GAP, marginRight: 4 }}>
            {DAY_LABELS.map((label, i) => (
              <View key={i} style={{ width: 10, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Rowan-Regular', fontSize: 7 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap: GAP }}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: 2,
                    backgroundColor: getCellColor(day),
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rowan-Regular', fontSize: 10 }}>Moins</Text>
        {['rgba(255,255,255,0.04)', '#8B6C02', '#D4A804', '#EFBF04'].map((color, i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: color }} />
        ))}
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rowan-Regular', fontSize: 10 }}>Plus</Text>
      </View>
    </View>
  );
}
