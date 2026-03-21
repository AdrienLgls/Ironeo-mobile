import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { hapticSelection } from '../../utils/haptics';
import { getLeaderboard } from '../../services/socialService';
import type { LeaderboardEntry } from '../../services/socialService';
import { SkeletonBox, SkeletonCircle, SkeletonText } from '../ui/Skeleton';
import { FadeIn, FadeInUp } from '../ui/FadeIn';
import EmptyState from '../ui/EmptyState';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeaderboardType = 'consistency' | 'volume' | 'power';
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

interface LeaderboardScreenProps {
  isPremium: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_PILLS: { value: LeaderboardType; label: string }[] = [
  { value: 'consistency', label: 'Régularité' },
  { value: 'volume', label: 'Volume' },
  { value: 'power', label: 'Force' },
];

const PERIOD_PILLS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'weekly', label: 'Cette semaine' },
  { value: 'monthly', label: 'Ce mois' },
  { value: 'alltime', label: 'Tout temps' },
];

const PAYWALL_THRESHOLD = 10;

// ─── Colors ───────────────────────────────────────────────────────────────────

const GOLD = '#EFBF04';
const SILVER = '#9CA3AF';
const BRONZE = '#D97706';
const BG = '#121212';

function rankColor(rank: number): string {
  if (rank === 1) return GOLD;
  if (rank === 2) return SILVER;
  if (rank === 3) return BRONZE;
  return 'rgba(255,255,255,0.4)';
}

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

const Pill = memo(function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => { hapticSelection().catch(() => undefined); onPress(); }}
      style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AvatarCircle = memo(function AvatarCircle({
  pseudo,
  size = 40,
  borderColor,
}: {
  pseudo: string;
  size?: number;
  borderColor?: string;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: borderColor ?? 'transparent',
          borderWidth: borderColor ? 2 : 0,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
        {pseudo.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
});

// ─── Top-3 Row ────────────────────────────────────────────────────────────────

const TopEntryRow = memo(function TopEntryRow({ entry }: { entry: LeaderboardEntry }) {
  const color = rankColor(entry.rank);
  return (
    <FadeInUp delay={entry.rank * 60} style={styles.topRow}>
      <View style={[styles.rankBadge, { borderColor: color }]}>
        <Text style={[styles.rankBadgeText, { color }]}>{rankLabel(entry.rank)}</Text>
      </View>
      <AvatarCircle pseudo={entry.pseudo} size={44} borderColor={color} />
      <View style={styles.entryInfo}>
        <Text style={styles.entryPseudo} numberOfLines={1}>{entry.pseudo}</Text>
        {entry.level != null && (
          <Text style={styles.entryLevel}>Niv. {entry.level}</Text>
        )}
      </View>
      <Text style={[styles.entryScore, { color }]}>{entry.score}</Text>
    </FadeInUp>
  );
});

// ─── Regular Row ─────────────────────────────────────────────────────────────

const EntryRow = memo(function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  const rankUp = entry.rankChange != null && entry.rankChange > 0;
  const rankDown = entry.rankChange != null && entry.rankChange < 0;
  return (
    <View style={styles.regularRow}>
      <Text style={styles.regularRank}>#{entry.rank}</Text>
      <AvatarCircle pseudo={entry.pseudo} size={32} />
      <Text style={styles.regularPseudo} numberOfLines={1}>{entry.pseudo}</Text>
      {entry.rankChange != null && entry.rankChange !== 0 && (
        <Text style={[styles.rankChange, rankUp ? styles.rankUp : rankDown ? styles.rankDown : undefined]}>
          {rankUp ? `↑${entry.rankChange}` : `↓${Math.abs(entry.rankChange)}`}
        </Text>
      )}
      <Text style={styles.regularScore}>{entry.score}</Text>
    </View>
  );
});

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonBox width={32} height={32} borderRadius={16} />
          <SkeletonCircle size={i < 3 ? 44 : 32} style={styles.skeletonAvatar} />
          <View style={styles.skeletonInfo}>
            <SkeletonText width={100 + (i % 3) * 20} height={14} />
            <SkeletonText width={60} height={11} style={styles.skeletonSubtext} />
          </View>
          <SkeletonBox width={40} height={18} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

// ─── Paywall Overlay ──────────────────────────────────────────────────────────

function PaywallOverlay({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.paywallWrapper}>
      <View style={styles.paywallBlur} />
      <View style={styles.paywallContent}>
        <Text style={styles.paywallIcon}>🔒</Text>
        <Text style={styles.paywallTitle}>Passe Premium pour voir le classement complet</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={styles.paywallButton}
        >
          <Text style={styles.paywallButtonText}>Passer Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── My Rank Card ─────────────────────────────────────────────────────────────

const MyRankCard = memo(function MyRankCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View style={styles.myRankCard}>
      <Text style={styles.myRankLabel}>Votre rang</Text>
      <Text style={styles.myRankValue}>#{entry.rank}</Text>
      <Text style={styles.myRankScore}>{entry.score} pts</Text>
    </View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeaderboardScreen({ isPremium }: LeaderboardScreenProps) {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('consistency');
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLeaderboard(selectedType, selectedPeriod);
      setEntries(response.entries ?? []);
      setMyRank(response.myRank ?? null);
    } catch {
      setError('Impossible de charger le classement');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedPeriod]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleEntries = isPremium ? entries : entries.slice(0, PAYWALL_THRESHOLD);
  const showPaywall = !isPremium && entries.length > PAYWALL_THRESHOLD;

  function renderItem({ item }: ListRenderItemInfo<LeaderboardEntry>) {
    if (item.rank <= 3) return <TopEntryRow entry={item} />;
    return <EntryRow entry={item} />;
  }

  return (
    <View style={styles.container}>
      {/* Type pills */}
      <FadeIn duration={300}>
        <View style={styles.pillRow}>
          {TYPE_PILLS.map((pill) => (
            <Pill
              key={pill.value}
              label={pill.label}
              active={selectedType === pill.value}
              onPress={() => setSelectedType(pill.value)}
            />
          ))}
        </View>
      </FadeIn>

      {/* Period pills */}
      <FadeIn duration={300} delay={60}>
        <View style={styles.pillRow}>
          {PERIOD_PILLS.map((pill) => (
            <Pill
              key={pill.value}
              label={pill.label}
              active={selectedPeriod === pill.value}
              onPress={() => setSelectedPeriod(pill.value)}
            />
          ))}
        </View>
      </FadeIn>

      {/* List area */}
      <View style={styles.listArea}>
        {loading ? (
          <LeaderboardSkeleton />
        ) : error !== null ? (
          <EmptyState
            icon="⚠️"
            title="Erreur de chargement"
            description={error}
            type="error"
            compact
          />
        ) : entries.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Classement vide"
            description="Aucune donnée pour cette période."
            compact
          />
        ) : (
          <>
            <FlatList
              data={visibleEntries}
              keyExtractor={(item) => item.userId}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
            {showPaywall && (
              <PaywallOverlay onPress={() => { /* handled by parent via navigation */ }} />
            )}
          </>
        )}
      </View>

      {/* My Rank fixed bottom */}
      {myRank != null && !loading && error === null && (
        <FadeInUp delay={200}>
          <MyRankCard entry={myRank} />
        </FadeInUp>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: GOLD,
  },
  pillInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Rowan-Regular',
  },
  pillTextActive: {
    color: '#000',
    fontFamily: 'Quilon-Medium',
  },
  pillTextInactive: {
    color: 'rgba(255,255,255,0.6)',
  },
  listArea: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  // Top 3 row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 14,
  },
  entryInfo: {
    flex: 1,
  },
  entryPseudo: {
    color: '#fafafa',
    fontSize: 14,
    fontFamily: 'Quilon-Medium',
  },
  entryLevel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: 'Rowan-Regular',
    marginTop: 2,
  },
  entryScore: {
    fontSize: 16,
    fontFamily: 'Quilon-Medium',
  },
  // Regular row
  regularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  regularRank: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: 'Rowan-Regular',
    width: 32,
  },
  regularPseudo: {
    flex: 1,
    color: '#fafafa',
    fontSize: 13,
    fontFamily: 'Rowan-Regular',
  },
  rankChange: {
    fontSize: 12,
    fontFamily: 'Rowan-Regular',
  },
  rankUp: {
    color: '#22c55e',
  },
  rankDown: {
    color: '#ef4444',
  },
  regularScore: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Quilon-Medium',
  },
  // Avatar
  avatar: {
    backgroundColor: 'rgba(239,191,4,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: GOLD,
    fontFamily: 'Quilon-Medium',
  },
  // Skeleton
  skeletonContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
  },
  skeletonAvatar: {
    marginLeft: 0,
  },
  skeletonInfo: {
    flex: 1,
    gap: 6,
  },
  skeletonSubtext: {
    marginTop: 4,
  },
  // Paywall
  paywallWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    justifyContent: 'flex-end',
  },
  paywallBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,18,18,0.85)',
  },
  paywallContent: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  paywallIcon: {
    fontSize: 28,
  },
  paywallTitle: {
    color: '#fafafa',
    fontSize: 14,
    fontFamily: 'Rowan-Regular',
    textAlign: 'center',
  },
  paywallButton: {
    marginTop: 8,
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  paywallButtonText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Quilon-Medium',
  },
  // My rank card
  myRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,191,4,0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239,191,4,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  myRankLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Rowan-Regular',
    flex: 1,
  },
  myRankValue: {
    color: GOLD,
    fontSize: 18,
    fontFamily: 'Quilon-Medium',
  },
  myRankScore: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Rowan-Regular',
  },
});
