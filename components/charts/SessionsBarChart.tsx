import React, { memo, useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

// Matches web SessionsBarChart: bar chart, max bar is blue (#3b82f6), others faded
// Ghost bars when < 2 data points

const SESSIONS_COLOR = '#3b82f6';
const SESSIONS_FADED = 'rgba(59, 130, 246, 0.2)';
const MUTED_COLOR = '#a0a0a0';
const CHART_MARGINS = { top: 10, right: 10, left: 24, bottom: 24 };

function formatWeekLabel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface WeekData {
  weekStart: string;
  sessions?: number;
}

interface SessionsBarChartProps {
  data: WeekData[];
  height?: number;
}

const SessionsBarChart = memo(function SessionsBarChart({ data, height = 180 }: SessionsBarChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((week) => ({
      name: formatWeekLabel(week.weekStart),
      sessions: week.sessions || 0,
    }));
  }, [data]);

  const width = Dimensions.get('window').width - 48;
  const plotW = width - CHART_MARGINS.left - CHART_MARGINS.right;
  const plotH = height - CHART_MARGINS.top - CHART_MARGINS.bottom;

  // Ghost state
  if (chartData.length < 2) {
    const ghostHeights = [0.4, 0.7, 0.5, 0.9, 0.6];
    const barW = Math.min(32, plotW / ghostHeights.length - 8);
    const gapW = plotW / ghostHeights.length;

    return (
      <View style={{ height }}>
        <Svg width={width} height={height}>
          {ghostHeights.map((h, i) => {
            const bh = h * plotH;
            const bx = CHART_MARGINS.left + i * gapW + (gapW - barW) / 2;
            const by = CHART_MARGINS.top + plotH - bh;
            return (
              <Rect
                key={i}
                x={bx}
                y={by}
                width={barW}
                height={bh}
                rx={4}
                ry={4}
                fill={SESSIONS_FADED}
                opacity={0.15}
              />
            );
          })}
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, color: MUTED_COLOR, fontFamily: 'Rowan-Regular', textAlign: 'center' }}>
            Complète 3 séances pour débloquer tes stats
          </Text>
        </View>
      </View>
    );
  }

  const maxSessions = Math.max(...chartData.map((d) => d.sessions), 1);
  const barW = Math.min(32, plotW / chartData.length - 8);
  const gapW = plotW / chartData.length;

  return (
    <View style={{ height }}>
      <Svg width={width} height={height}>
        {/* Y-axis ticks */}
        {[0, Math.ceil(maxSessions / 2), maxSessions].map((v, i) => {
          const y = CHART_MARGINS.top + (1 - v / maxSessions) * plotH;
          return (
            <SvgText
              key={i}
              x={CHART_MARGINS.left - 4}
              y={y + 4}
              fontSize={10}
              fill={MUTED_COLOR}
              textAnchor="end"
            >
              {v}
            </SvgText>
          );
        })}

        {chartData.map((d, i) => {
          const bh = (d.sessions / maxSessions) * plotH;
          const bx = CHART_MARGINS.left + i * gapW + (gapW - barW) / 2;
          const by = CHART_MARGINS.top + plotH - bh;
          const isMax = d.sessions === maxSessions;

          return (
            <React.Fragment key={i}>
              <Rect
                x={bx}
                y={by}
                width={barW}
                height={Math.max(bh, 2)}
                rx={4}
                ry={4}
                fill={isMax ? SESSIONS_COLOR : SESSIONS_FADED}
              />
              <SvgText
                x={bx + barW / 2}
                y={height - 6}
                fontSize={10}
                fill={MUTED_COLOR}
                textAnchor="middle"
              >
                {d.name}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
});

export default SessionsBarChart;
