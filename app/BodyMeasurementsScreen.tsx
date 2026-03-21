import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Polyline,
  Stop,
  Text as SvgText,
  Circle,
} from 'react-native-svg';
import { FadeIn, FadeInUp } from '../components/ui/FadeIn';
import { SkeletonBox } from '../components/ui/Skeleton';
import {
  addMeasurement,
  deleteMeasurement,
  getMeasurements,
  type Measurement,
  type MeasurementTrends,
} from '../services/measurementService';
import { formatDate, formatDateShort } from '../utils/formatters';
import { hapticSuccess } from '../utils/haptics';

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = '#EFBF04';
const CHART_COLOR = '#EFBF04';
const MUTED = '#a0a0a0';
const CHART_MARGINS = { top: 10, right: 10, left: 38, bottom: 24 };

type MetricKey = 'weight' | 'bodyFat' | 'chest' | 'waist' | 'hips' | 'shoulders';

const METRIC_LABELS: Record<MetricKey, string> = {
  weight: 'Poids',
  bodyFat: 'Masse grasse',
  chest: 'Poitrine',
  waist: 'Taille',
  hips: 'Hanches',
  shoulders: 'Épaules',
};

const METRIC_UNITS: Record<MetricKey, string> = {
  weight: 'kg',
  bodyFat: '%',
  chest: 'cm',
  waist: 'cm',
  hips: 'cm',
  shoulders: 'cm',
};

// For these metrics, gain = red, loss = green (body fat, waist, hips)
const LOWER_IS_BETTER: MetricKey[] = ['bodyFat', 'waist', 'hips'];

const TIME_RANGES: { label: string; months: number }[] = [
  { label: '3 mois', months: 3 },
  { label: '6 mois', months: 6 },
  { label: '12 mois', months: 12 },
];

const METRICS: MetricKey[] = ['weight', 'bodyFat', 'chest', 'waist', 'hips', 'shoulders'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDeltaColor(delta: number, metric: MetricKey): string {
  const lowerIsBetter = LOWER_IS_BETTER.includes(metric);
  if (delta === 0) return MUTED;
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  return isGood ? '#10b981' : '#ef4444';
}

function getDeltaSymbol(delta: number): string {
  if (delta > 0) return '▲';
  if (delta < 0) return '▼';
  return '–';
}

// ─── Delta Badge ─────────────────────────────────────────────────────────────

interface DeltaBadgeProps {
  delta: number;
  metric: MetricKey;
  unit: string;
}

function DeltaBadge({ delta, metric, unit }: DeltaBadgeProps) {
  if (delta === 0) return null;
  const color = getDeltaColor(delta, metric);
  const symbol = getDeltaSymbol(delta);
  const abs = Math.abs(delta);
  const label = abs < 1 ? abs.toFixed(1) : String(Math.round(abs));

  return (
    <View style={[styles.deltaBadge, { borderColor: color + '40', backgroundColor: color + '15' }]}>
      <Text style={[styles.deltaBadgeText, { color }]}>
        {symbol} {label}{unit}
      </Text>
    </View>
  );
}

// ─── Quick Stats Row ──────────────────────────────────────────────────────────

interface QuickStatsRowProps {
  measurements: Measurement[];
  deltas: Record<string, number>;
}

function QuickStatsRow({ measurements, deltas }: QuickStatsRowProps) {
  const latest = measurements[0];

  const chips: { metric: MetricKey; label: string; value: number | undefined; unit: string }[] = [
    { metric: 'weight', label: 'Poids', value: latest?.weight, unit: 'kg' },
    { metric: 'bodyFat', label: 'Masse grasse', value: latest?.bodyFat, unit: '%' },
    { metric: 'waist', label: 'Tour de taille', value: latest?.waist, unit: 'cm' },
    {
      metric: 'bicepsLeft' as MetricKey,
      label: 'Biceps',
      value: latest?.bicepsLeft ?? latest?.bicepsRight,
      unit: 'cm',
    },
  ];

  return (
    <View style={styles.quickStatsRow}>
      {chips.map(({ metric, label, value, unit }) => (
        <View key={metric} style={styles.quickStatChip}>
          <Text style={styles.quickStatLabel}>{label}</Text>
          <Text style={styles.quickStatValue}>
            {value != null ? `${value}${unit}` : '–'}
          </Text>
          {value != null && deltas[metric] !== undefined && deltas[metric] !== 0 && (
            <DeltaBadge delta={deltas[metric]} metric={metric as MetricKey} unit={unit} />
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Metric Selector ─────────────────────────────────────────────────────────

interface MetricSelectorProps {
  selected: MetricKey;
  onSelect: (m: MetricKey) => void;
}

function MetricSelector({ selected, onSelect }: MetricSelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={styles.pillContent}>
      {METRICS.map((m) => (
        <TouchableOpacity
          key={m}
          activeOpacity={0.7}
          onPress={() => onSelect(m)}
          style={[styles.pill, selected === m && styles.pillActive]}
        >
          <Text style={[styles.pillText, selected === m && styles.pillTextActive]}>
            {METRIC_LABELS[m]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Line Chart ──────────────────────────────────────────────────────────────

interface LineChartProps {
  measurements: Measurement[];
  metric: MetricKey;
  height?: number;
}

function LineChart({ measurements, metric, height = 180 }: LineChartProps) {
  const width = Dimensions.get('window').width - 32;
  const plotW = width - CHART_MARGINS.left - CHART_MARGINS.right;
  const plotH = height - CHART_MARGINS.top - CHART_MARGINS.bottom;

  const chartData = useMemo(() => {
    return measurements
      .filter((m) => m[metric] != null)
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m) => ({
        name: formatDateShort(m.date),
        value: m[metric] as number,
      }));
  }, [measurements, metric]);

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
            stroke={CHART_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.2}
          />
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.ghostLabel}>Ajoute 2 mesures pour voir l'évolution</Text>
        </View>
      </View>
    );
  }

  const maxVal = Math.max(...chartData.map((d) => d.value), 1);
  const minVal = Math.min(...chartData.map((d) => d.value));
  const range = maxVal - minVal || maxVal * 0.1;
  const paddedMax = maxVal + range * 0.1;
  const paddedMin = Math.max(0, minVal - range * 0.1);

  const px = (i: number) => CHART_MARGINS.left + (i / (chartData.length - 1)) * plotW;
  const py = (v: number) =>
    CHART_MARGINS.top + (1 - (v - paddedMin) / (paddedMax - paddedMin)) * plotH;

  const linePoints = chartData.map((d, i) => `${px(i)},${py(d.value)}`).join(' ');

  const areaPath =
    `M ${px(0)},${py(chartData[0].value)} ` +
    chartData
      .slice(1)
      .map((d, i) => `L ${px(i + 1)},${py(d.value)}`)
      .join(' ') +
    ` L ${px(chartData.length - 1)},${CHART_MARGINS.top + plotH}` +
    ` L ${CHART_MARGINS.left},${CHART_MARGINS.top + plotH} Z`;

  const yTicks = [paddedMin, (paddedMin + paddedMax) / 2, paddedMax].map((v) => ({
    value: v,
    y: py(v),
  }));

  // Show at most 4 x-axis labels to avoid clutter
  const xStep = Math.max(1, Math.floor(chartData.length / 4));

  return (
    <View style={{ height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="measGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.35} />
            <Stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {yTicks.map((t, i) => (
          <SvgText
            key={i}
            x={CHART_MARGINS.left - 5}
            y={t.y + 4}
            fontSize={10}
            fill={MUTED}
            textAnchor="end"
          >
            {t.value < 10 ? t.value.toFixed(1) : Math.round(t.value)}
          </SvgText>
        ))}

        <Path d={areaPath} fill="url(#measGrad)" />

        <Polyline points={linePoints} fill="none" stroke={CHART_COLOR} strokeWidth={2} />

        {chartData.map((d, i) => (
          <Circle
            key={i}
            cx={px(i)}
            cy={py(d.value)}
            r={3}
            fill={CHART_COLOR}
            stroke="#121212"
            strokeWidth={1.5}
          />
        ))}

        {chartData.map((d, i) =>
          i % xStep === 0 || i === chartData.length - 1 ? (
            <SvgText
              key={i}
              x={px(i)}
              y={height - 6}
              fontSize={9}
              fill={MUTED}
              textAnchor="middle"
            >
              {d.name}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
}

// ─── Time Range Selector ──────────────────────────────────────────────────────

interface TimeRangeSelectorProps {
  selected: number;
  onSelect: (months: number) => void;
}

function TimeRangeSelector({ selected, onSelect }: TimeRangeSelectorProps) {
  return (
    <View style={styles.timeRangeRow}>
      {TIME_RANGES.map(({ label, months }) => (
        <TouchableOpacity
          key={months}
          activeOpacity={0.7}
          onPress={() => onSelect(months)}
          style={[styles.timeRangePill, selected === months && styles.timeRangePillActive]}
        >
          <Text style={[styles.timeRangeText, selected === months && styles.timeRangeTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Add Form ─────────────────────────────────────────────────────────────────

interface AddFormField {
  key: keyof Measurement;
  label: string;
}

const QUICK_FIELDS: AddFormField[] = [
  { key: 'weight', label: 'Poids (kg)' },
  { key: 'bodyFat', label: 'Masse grasse (%)' },
  { key: 'chest', label: 'Poitrine (cm)' },
  { key: 'waist', label: 'Taille (cm)' },
];

interface AddFormState {
  weight: string;
  bodyFat: string;
  chest: string;
  waist: string;
}

const EMPTY_FORM: AddFormState = { weight: '', bodyFat: '', chest: '', waist: '' };

interface AddMeasurementFormProps {
  onSaved: () => void;
}

function AddMeasurementForm({ onSaved }: AddMeasurementFormProps) {
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function handleChange(key: keyof AddFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const payload: Partial<Measurement> = {};
    if (form.weight) payload.weight = parseFloat(form.weight);
    if (form.bodyFat) payload.bodyFat = parseFloat(form.bodyFat);
    if (form.chest) payload.chest = parseFloat(form.chest);
    if (form.waist) payload.waist = parseFloat(form.waist);

    if (Object.keys(payload).length === 0) {
      toast.warning('Remplis au moins un champ.');
      return;
    }

    setSaving(true);
    try {
      await addMeasurement(payload);
      await hapticSuccess();
      setForm(EMPTY_FORM);
      onSaved();
    } catch {
      toast.error('Impossible d\'enregistrer la mesure.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.formContainer}>
      {QUICK_FIELDS.map(({ key, label }) => (
        <View key={key} style={styles.formField}>
          <Text style={styles.formLabel}>{label}</Text>
          <TextInput
            value={form[key as keyof AddFormState]}
            onChangeText={(v) => handleChange(key as keyof AddFormState, v)}
            placeholder="–"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="numeric"
            style={styles.formInput}
          />
        </View>
      ))}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSave}
        disabled={saving}
        style={styles.saveButton}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── History List ─────────────────────────────────────────────────────────────

interface HistoryListProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
}

function HistoryList({ measurements, onDelete }: HistoryListProps) {
  const recent = measurements.slice(0, 10);
  const confirm = useConfirm();

  if (recent.length === 0) {
    return (
      <View style={styles.emptyHistory}>
        <Text style={styles.emptyHistoryText}>Aucune mesure enregistrée</Text>
      </View>
    );
  }

  async function confirmDelete(id: string) {
    const ok = await confirm({
      title: 'Supprimer',
      message: 'Supprimer cette mesure ?',
      confirmText: 'Supprimer',
      destructive: true,
    });
    if (ok) onDelete(id);
  }

  return (
    <View>
      {recent.map((m) => (
        <TouchableOpacity
          key={m._id}
          activeOpacity={0.7}
          onLongPress={() => confirmDelete(m._id)}
          style={styles.historyRow}
        >
          <View style={styles.historyLeft}>
            <Text style={styles.historyDate}>{formatDate(m.date)}</Text>
            <Text style={styles.historyDetails}>
              {[
                m.weight != null && `${m.weight} kg`,
                m.waist != null && `taille ${m.waist} cm`,
              ]
                .filter(Boolean)
                .join(' · ') || 'Autres mesures'}
            </Text>
          </View>
          <Text style={styles.historyDelete}>×</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface BodyMeasurementsScreenProps {
  onBack?: () => void;
}

export default function BodyMeasurementsScreen({ onBack }: BodyMeasurementsScreenProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [trends, setTrends] = useState<MeasurementTrends>({ measurements: [], latestDeltas: {} });
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('weight');
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(
    async (months: number) => {
      setLoading(true);
      try {
        const data = await getMeasurements(months);
        setTrends(data);
      } catch {
        toast.error('Impossible de charger les mensurations.');
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(selectedMonths);
  }, [load, selectedMonths]);

  function handleTimeRangeChange(months: number) {
    setSelectedMonths(months);
  }

  function handleSaved() {
    setFormOpen(false);
    load(selectedMonths);
  }

  async function handleDelete(id: string) {
    try {
      await deleteMeasurement(id);
      setTrends((prev) => ({
        ...prev,
        measurements: prev.measurements.filter((m) => m._id !== id),
      }));
    } catch {
      toast.error('Impossible de supprimer cette mesure.');
    }
  }

  const sorted = useMemo(
    () =>
      trends.measurements
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [trends.measurements]
  );

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.screenContent,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => load(selectedMonths)}
          tintColor="#EFBF04"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Mensurations</Text>
      </View>

      {/* Quick Stats */}
      {loading ? (
        <View style={styles.skeletonRow}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBox key={i} width="23%" height={72} borderRadius={12} />
          ))}
        </View>
      ) : (
        <FadeIn>
          <QuickStatsRow measurements={sorted} deltas={trends.latestDeltas} />
        </FadeIn>
      )}

      {/* Metric Selector */}
      <FadeInUp delay={80}>
        <MetricSelector selected={selectedMetric} onSelect={setSelectedMetric} />
      </FadeInUp>

      {/* Chart */}
      <FadeInUp delay={140}>
        <View style={styles.chartCard}>
          <TimeRangeSelector selected={selectedMonths} onSelect={handleTimeRangeChange} />
          {loading ? (
            <SkeletonBox width="100%" height={180} borderRadius={8} />
          ) : (
            <LineChart measurements={trends.measurements} metric={selectedMetric} />
          )}
        </View>
      </FadeInUp>

      {/* Add Form Toggle */}
      <FadeInUp delay={200}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setFormOpen((prev) => !prev)}
          style={styles.toggleFormButton}
        >
          <Text style={styles.toggleFormText}>
            {formOpen ? '✕ Fermer' : '+ Ajouter une mesure'}
          </Text>
        </TouchableOpacity>

        {formOpen && (
          <FadeIn duration={200}>
            <AddMeasurementForm onSaved={handleSaved} />
          </FadeIn>
        )}
      </FadeInUp>

      {/* History */}
      <FadeInUp delay={260}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {loading ? (
            <View style={{ gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <SkeletonBox key={i} width="100%" height={52} borderRadius={12} />
              ))}
            </View>
          ) : (
            <HistoryList measurements={sorted} onDelete={handleDelete} />
          )}
        </View>
      </FadeInUp>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  screenContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    color: ACCENT,
    fontSize: 22,
    fontFamily: 'Rowan-Regular',
  },
  title: {
    color: '#fafafa',
    fontSize: 22,
    fontFamily: 'Quilon-Medium',
  },
  // Quick stats
  quickStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickStatChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  quickStatLabel: {
    color: '#a0a0a0',
    fontSize: 9,
    fontFamily: 'Rowan-Regular',
    textAlign: 'center',
  },
  quickStatValue: {
    color: '#fafafa',
    fontSize: 14,
    fontFamily: 'Quilon-Medium',
    textAlign: 'center',
  },
  deltaBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  deltaBadgeText: {
    fontSize: 9,
    fontFamily: 'Rowan-Regular',
  },
  // Metric pills
  pillScroll: {
    marginBottom: 12,
  },
  pillContent: {
    gap: 8,
    paddingRight: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: ACCENT,
  },
  pillText: {
    color: '#a0a0a0',
    fontSize: 13,
    fontFamily: 'Rowan-Regular',
  },
  pillTextActive: {
    color: '#121212',
    fontFamily: 'Quilon-Medium',
  },
  // Chart
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  ghostLabel: {
    color: '#a0a0a0',
    fontSize: 13,
    fontFamily: 'Rowan-Regular',
    textAlign: 'center',
  },
  timeRangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timeRangePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  timeRangePillActive: {
    backgroundColor: 'rgba(239,191,4,0.2)',
  },
  timeRangeText: {
    color: '#a0a0a0',
    fontSize: 12,
    fontFamily: 'Rowan-Regular',
  },
  timeRangeTextActive: {
    color: ACCENT,
    fontFamily: 'Quilon-Medium',
  },
  // Skeleton row
  skeletonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  // Add form
  toggleFormButton: {
    backgroundColor: 'rgba(239,191,4,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,191,4,0.25)',
  },
  toggleFormText: {
    color: ACCENT,
    fontSize: 14,
    fontFamily: 'Quilon-Medium',
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  formField: {
    gap: 4,
  },
  formLabel: {
    color: '#a0a0a0',
    fontSize: 11,
    fontFamily: 'Rowan-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fafafa',
    fontSize: 15,
    fontFamily: 'Rowan-Regular',
  },
  saveButton: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#121212',
    fontSize: 15,
    fontFamily: 'Quilon-Medium',
  },
  // History
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    color: '#fafafa',
    fontSize: 16,
    fontFamily: 'Quilon-Medium',
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  historyLeft: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    color: '#fafafa',
    fontSize: 13,
    fontFamily: 'Quilon-Medium',
  },
  historyDetails: {
    color: '#a0a0a0',
    fontSize: 12,
    fontFamily: 'Rowan-Regular',
  },
  historyDelete: {
    color: '#a0a0a0',
    fontSize: 18,
    paddingLeft: 12,
  },
  emptyHistory: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontFamily: 'Rowan-Regular',
  },
});
