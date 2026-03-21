import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  ListRenderItemInfo,
} from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getYearInReview } from '../services/userService';
import type { YearInReview } from '../services/userService';

// ---------------------------------------------------------------------------
// Navigation type — YearInReview can be pushed from ProfileHome stack
// ---------------------------------------------------------------------------

export type YearInReviewScreenParams = {
  YearInReview: undefined;
};

type Props = NativeStackScreenProps<YearInReviewScreenParams, 'YearInReview'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const GOLD = '#EFBF04';
const BG = '#121212';
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const SLIDE_COUNT = 5;

// ---------------------------------------------------------------------------
// AnimatedCounter
// ---------------------------------------------------------------------------

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  style?: object;
  textStyle?: object;
}

const AnimatedCounter = memo(function AnimatedCounter({
  value,
  suffix,
  style,
  textStyle,
}: AnimatedCounterProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration: 1500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    const listener = anim.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });

    return () => {
      anim.removeListener(listener);
    };
  }, [anim, value]);

  return (
    <View style={style}>
      <Text style={textStyle}>
        {display.toLocaleString('fr-FR')}
        {suffix ?? ''}
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// StatBox — reusable 2×2 grid cell
// ---------------------------------------------------------------------------

interface StatBoxProps {
  label: string;
  value: number;
  suffix?: string;
}

const StatBox = memo(function StatBox({ label, value, suffix }: StatBoxProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        margin: 6,
      }}
    >
      <AnimatedCounter
        value={value}
        suffix={suffix}
        textStyle={{ color: GOLD, fontSize: 32, fontWeight: '700', letterSpacing: -0.5 }}
      />
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Slide 1: Vue d'ensemble
// ---------------------------------------------------------------------------

function Slide1({ data }: { data: YearInReview }) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 24, paddingTop: 40, justifyContent: 'center' }}>
      <Text style={{ color: GOLD, fontSize: 64, fontWeight: '700', letterSpacing: -2, textAlign: 'center' }}>
        {data.year}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, textAlign: 'center', marginBottom: 48, letterSpacing: 4 }}>
        EN CHIFFRES
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
        <StatBox label="Séances" value={data.totalWorkouts} />
        <StatBox label="Jours actifs" value={data.trainingDays} />
        <StatBox label="Records" value={data.totalPRs} />
        <StatBox label="Meilleur streak" value={data.bestStreak} suffix=" j" />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 2: Volume
// ---------------------------------------------------------------------------

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
}

function Slide2({ data }: { data: YearInReview }) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 4, marginBottom: 16 }}>
        PUISSANCE
      </Text>

      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <AnimatedCounter
          value={data.totalVolume}
          suffix=" kg"
          textStyle={{ color: GOLD, fontSize: 72, fontWeight: '800', letterSpacing: -2 }}
        />
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>volume total soulevé</Text>
      </View>

      <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{formatDuration(data.totalDuration)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>durée totale</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{data.totalSets.toLocaleString('fr-FR')} sets</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>séries complétées</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{data.heaviestWeight} kg</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>charge max</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 3: Par mois (bar chart SVG)
// ---------------------------------------------------------------------------

const CHART_HEIGHT = 160;
const CHART_MARGINS = { top: 8, right: 8, left: 8, bottom: 24 };

function MonthlyBarChart({ monthlyWorkouts, bestMonth }: { monthlyWorkouts: number[]; bestMonth: number }) {
  const chartWidth = SCREEN_WIDTH - 48;
  const plotW = chartWidth - CHART_MARGINS.left - CHART_MARGINS.right;
  const plotH = CHART_HEIGHT - CHART_MARGINS.top - CHART_MARGINS.bottom;
  const maxVal = Math.max(...monthlyWorkouts, 1);
  const barCount = monthlyWorkouts.length;
  const gapW = plotW / barCount;
  const barW = Math.max(4, gapW - 4);

  return (
    <Svg width={chartWidth} height={CHART_HEIGHT}>
      {monthlyWorkouts.map((val, i) => {
        const bh = Math.max(2, (val / maxVal) * plotH);
        const bx = CHART_MARGINS.left + i * gapW + (gapW - barW) / 2;
        const by = CHART_MARGINS.top + plotH - bh;
        const isGold = i === bestMonth;

        return (
          <React.Fragment key={i}>
            <Rect
              x={bx}
              y={by}
              width={barW}
              height={bh}
              rx={3}
              ry={3}
              fill={isGold ? GOLD : 'rgba(255,255,255,0.2)'}
            />
            <SvgText
              x={bx + barW / 2}
              y={CHART_HEIGHT - 6}
              fontSize={9}
              fill="rgba(255,255,255,0.4)"
              textAnchor="middle"
            >
              {MONTH_LABELS[i]}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function Slide3({ data }: { data: YearInReview }) {
  const bestMonthName = MONTH_LABELS[data.bestMonth] ?? '—';

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 4, marginBottom: 32, textAlign: 'center' }}>
        RÉGULARITÉ
      </Text>

      <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <MonthlyBarChart monthlyWorkouts={data.monthlyWorkouts} bestMonth={data.bestMonth} />
      </View>

      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' }}>
        Meilleur mois :{' '}
        <Text style={{ color: GOLD, fontWeight: '700' }}>
          {bestMonthName} avec {data.bestMonthWorkouts} séances
        </Text>
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 4: Apprentissage
// ---------------------------------------------------------------------------

interface LearnStatRowProps {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  gold?: boolean;
}

function LearnStatRow({ icon, label, value, suffix, gold }: LearnStatRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
      }}
    >
      <Text style={{ fontSize: 22, marginRight: 14 }}>{icon}</Text>
      <Text style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: gold ? GOLD : '#fff', fontSize: 18, fontWeight: '700' }}>
        {value.toLocaleString('fr-FR')}
        {suffix ?? ''}
      </Text>
    </View>
  );
}

function Slide4({ data }: { data: YearInReview }) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 4, marginBottom: 32, textAlign: 'center' }}>
        SAVOIR
      </Text>

      <LearnStatRow icon="📖" label="Articles lus" value={data.articlesRead} />
      <LearnStatRow icon="🎓" label="Articles maîtrisés" value={data.articlesMastered} />
      <LearnStatRow icon="🎖" label="Badges obtenus" value={data.badgesEarned} />
      <LearnStatRow icon="⭐" label="Points accumulés" value={data.totalPoints} gold />

      <View
        style={{
          alignSelf: 'center',
          backgroundColor: `${GOLD}22`,
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 8,
          marginTop: 16,
          borderWidth: 1,
          borderColor: `${GOLD}44`,
        }}
      >
        <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Niveau {data.level}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide 5: Conclusion
// ---------------------------------------------------------------------------

function getMotivationalMessage(totalWorkouts: number): string {
  if (totalWorkouts < 50) return 'Bon début ! Continue sur ta lancée 💪';
  if (totalWorkouts <= 150) return 'Impressionnant ! Tu es sur la bonne voie 🔥';
  return 'LÉGENDAIRE. Tu es une machine 🏆';
}

function Slide5({ data, onBack }: { data: YearInReview; onBack: () => void }) {
  const message = getMotivationalMessage(data.totalWorkouts);

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12, lineHeight: 30 }}>
        {message}
      </Text>

      <View
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 20,
          padding: 24,
          marginTop: 32,
          marginBottom: 40,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: GOLD, fontSize: 36, fontWeight: '800' }}>{data.year}</Text>
        <View style={{ flexDirection: 'row', gap: 32, marginTop: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{data.totalWorkouts}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>séances</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{data.bestStreak}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>streak max</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.8}
        style={{
          backgroundColor: GOLD,
          borderRadius: 16,
          paddingHorizontal: 40,
          paddingVertical: 16,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#121212', fontSize: 16, fontWeight: '700' }}>Continuer l'aventure</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Navigation dots
// ---------------------------------------------------------------------------

function NavDots({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === activeIndex ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === activeIndex ? GOLD : 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
        Données insuffisantes
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
        Reviens après avoir complété quelques séances pour débloquer ton récap annuel.
      </Text>
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.8}
        style={{ marginTop: 32, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 }}
      >
        <Text style={{ color: GOLD, fontSize: 14, fontWeight: '600' }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide ID type
// ---------------------------------------------------------------------------

type SlideId = 'overview' | 'volume' | 'monthly' | 'learning' | 'conclusion';

interface SlideItem {
  id: SlideId;
  index: number;
}

const SLIDES: SlideItem[] = [
  { id: 'overview', index: 0 },
  { id: 'volume', index: 1 },
  { id: 'monthly', index: 2 },
  { id: 'learning', index: 3 },
  { id: 'conclusion', index: 4 },
];

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function YearInReviewScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<YearInReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    getYearInReview()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveSlide(index);
    },
    []
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<SlideItem>) => {
      if (!data) return null;

      switch (item.id) {
        case 'overview':
          return <Slide1 data={data} />;
        case 'volume':
          return <Slide2 data={data} />;
        case 'monthly':
          return <Slide3 data={data} />;
        case 'learning':
          return <Slide4 data={data} />;
        case 'conclusion':
          return <Slide5 data={data} onBack={handleBack} />;
        default:
          return null;
      }
    },
    [data, handleBack]
  );

  const keyExtractor = useCallback((item: SlideItem) => item.id, []);

  const year = data?.year ?? new Date().getFullYear();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={{ padding: 8, marginRight: 8 }}>
          <Text style={{ color: GOLD, fontSize: 16 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginRight: 64 }}>
          Mon année {year}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : data === null ? (
        <EmptyState onBack={handleBack} />
      ) : (
        <>
          <FlatList<SlideItem>
            data={SLIDES}
            keyExtractor={keyExtractor}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            style={{ flex: 1 }}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />

          {/* Navigation dots */}
          <View style={{ paddingBottom: insets.bottom + 24, paddingTop: 16 }}>
            <NavDots activeIndex={activeSlide} />
          </View>
        </>
      )}
    </View>
  );
}
