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
  Line,
} from 'react-native-svg';

// Matches web VolumeAreaChart: area chart with green (#10b981) gradient fill
// Ghost dotted line when < 2 data points

const VOLUME_COLOR = '#10b981';
const MUTED_COLOR = '#a0a0a0';
const CHART_MARGINS = { top: 10, right: 10, left: 40, bottom: 24 };

function formatVolumeShort(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
  }
  return `${Math.round(value)}`;
}


interface WeekData {
  weekStart: string;
  totalVolume?: number;
}

interface VolumeAreaChartProps {
  data: WeekData[];
  height?: number;
}

const VolumeAreaChart = memo(function VolumeAreaChart({ data, height = 180 }: VolumeAreaChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((week) => ({
      name: formatDateShort(week.weekStart),
      volume: Math.round(week.totalVolume || 0),
    }));
  }, [data]);

  const width = Dimensions.get('window').width - 48; // account for screen padding

  const plotW = width - CHART_MARGINS.left - CHART_MARGINS.right;
  const plotH = height - CHART_MARGINS.top - CHART_MARGINS.bottom;

  // Ghost state — < 2 data points
  if (chartData.length < 2) {
    const ghostPoints = [0.7, 0.5, 0.6, 0.3, 0.45];
    const gx = (i: number) => CHART_MARGINS.left + (i / (ghostPoints.length - 1)) * plotW;
    const gy = (v: number) => CHART_MARGINS.top + (1 - v) * plotH;
    const pts = ghostPoints.map((v, i) => `${gx(i)},${gy(v)}`).join(' ');
    return (
      <View style={{ height }}>
        <Svg width={width} height={height}>
          <Polyline
            points={pts}
            fill="none"
            stroke={VOLUME_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.2}
          />
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, color: MUTED_COLOR, fontFamily: 'Rowan-Regular', textAlign: 'center' }}>
            Complète 3 séances pour débloquer tes stats
          </Text>
        </View>
      </View>
    );
  }

  const maxVol = Math.max(...chartData.map((d) => d.volume), 1);
  const minVol = Math.min(...chartData.map((d) => d.volume));

  const px = (i: number) => CHART_MARGINS.left + (i / (chartData.length - 1)) * plotW;
  const py = (v: number) => CHART_MARGINS.top + (1 - (v - 0) / (maxVol * 1.1)) * plotH;

  const linePoints = chartData.map((d, i) => `${px(i)},${py(d.volume)}`).join(' ');

  // Area path: line + down to bottom-right + across to bottom-left + up
  const areaPath =
    `M ${px(0)},${py(chartData[0].volume)} ` +
    chartData
      .slice(1)
      .map((d, i) => `L ${px(i + 1)},${py(d.volume)}`)
      .join(' ') +
    ` L ${px(chartData.length - 1)},${CHART_MARGINS.top + plotH}` +
    ` L ${CHART_MARGINS.left},${CHART_MARGINS.top + plotH} Z`;

  // Y-axis ticks (3)
  const yTicks = [0, 0.5, 1].map((t) => ({ value: Math.round(maxVol * 1.1 * t), y: py(maxVol * 1.1 * t) }));

  return (
    <View style={{ height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="5%" stopColor={VOLUME_COLOR} stopOpacity={0.4} />
            <Stop offset="95%" stopColor={VOLUME_COLOR} stopOpacity={0.05} />
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
            {formatVolumeShort(t.value)}
          </SvgText>
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#volGrad)" />

        {/* Line */}
        <Polyline
          points={linePoints}
          fill="none"
          stroke={VOLUME_COLOR}
          strokeWidth={2}
        />

        {/* Dots */}
        {chartData.map((d, i) => (
          <Circle
            key={i}
            cx={px(i)}
            cy={py(d.volume)}
            r={3}
            fill={VOLUME_COLOR}
            stroke="#1a1a1a"
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

export default VolumeAreaChart;
