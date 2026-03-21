import React, { memo, useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { formatDateShort } from '../../utils/formatters';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Polyline,
  Path,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import type { ExerciseHistoryEntry } from '../../services/workoutService';

// Golden line, green→transparent gradient fill — mirrors VolumeAreaChart pattern

const LINE_COLOR = '#EFBF04';
const FILL_COLOR = '#10b981';
const MUTED_COLOR = '#a0a0a0';
const CHART_MARGINS = { top: 10, right: 10, left: 40, bottom: 24 };


interface ExerciseHistoryChartProps {
  data: ExerciseHistoryEntry[];
  height?: number;
}

const ExerciseHistoryChart = memo(function ExerciseHistoryChart({
  data,
  height = 180,
}: ExerciseHistoryChartProps) {
  const chartData = useMemo(() => {
    const last6 = data.slice(-6);
    return last6.map((entry) => ({
      name: formatDateShort(entry.date),
      weight: entry.maxWeight,
    }));
  }, [data]);

  const width = Dimensions.get('window').width - 48;
  const plotW = width - CHART_MARGINS.left - CHART_MARGINS.right;
  const plotH = height - CHART_MARGINS.top - CHART_MARGINS.bottom;

  // Empty / ghost state
  if (chartData.length < 2) {
    const ghostPoints = [0.5, 0.7, 0.4, 0.65, 0.55];
    const gx = (i: number) => CHART_MARGINS.left + (i / (ghostPoints.length - 1)) * plotW;
    const gy = (v: number) => CHART_MARGINS.top + (1 - v) * plotH;
    const pts = ghostPoints.map((v, i) => `${gx(i)},${gy(v)}`).join(' ');
    return (
      <View style={{ height }}>
        <Svg width={width} height={height}>
          <Polyline
            points={pts}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.2}
          />
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, color: MUTED_COLOR, fontFamily: 'Rowan-Regular', textAlign: 'center' }}>
            Pas assez de données pour afficher le graphique
          </Text>
        </View>
      </View>
    );
  }

  const maxWeight = Math.max(...chartData.map((d) => d.weight), 1);

  const px = (i: number) => CHART_MARGINS.left + (i / (chartData.length - 1)) * plotW;
  const py = (v: number) => CHART_MARGINS.top + (1 - v / (maxWeight * 1.1)) * plotH;

  const linePoints = chartData.map((d, i) => `${px(i)},${py(d.weight)}`).join(' ');

  const areaPath =
    `M ${px(0)},${py(chartData[0].weight)} ` +
    chartData
      .slice(1)
      .map((d, i) => `L ${px(i + 1)},${py(d.weight)}`)
      .join(' ') +
    ` L ${px(chartData.length - 1)},${CHART_MARGINS.top + plotH}` +
    ` L ${CHART_MARGINS.left},${CHART_MARGINS.top + plotH} Z`;

  const yTicks = [0, 0.5, 1].map((t) => ({
    value: Math.round(maxWeight * 1.1 * t),
    y: py(maxWeight * 1.1 * t),
  }));

  return (
    <View style={{ height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="exHistGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="5%" stopColor={FILL_COLOR} stopOpacity={0.4} />
            <Stop offset="95%" stopColor={FILL_COLOR} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {/* Y-axis ticks */}
        {yTicks.map((t, i) => (
          <SvgText
            key={i}
            x={CHART_MARGINS.left - 6}
            y={t.y + 4}
            fontSize={10}
            fill={MUTED_COLOR}
            textAnchor="end"
          >
            {t.value}
          </SvgText>
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#exHistGrad)" />

        {/* Golden line */}
        <Polyline points={linePoints} fill="none" stroke={LINE_COLOR} strokeWidth={2} />

        {/* Dots */}
        {chartData.map((d, i) => (
          <Circle
            key={i}
            cx={px(i)}
            cy={py(d.weight)}
            r={3}
            fill={LINE_COLOR}
            stroke="#121212"
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels */}
        {chartData.map((d, i) => (
          <SvgText
            key={i}
            x={px(i)}
            y={height - 6}
            fontSize={10}
            fill={MUTED_COLOR}
            textAnchor="middle"
          >
            {d.name}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
});

export default ExerciseHistoryChart;
