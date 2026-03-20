import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { getGroupLeaderboard } from '../../services/groupService';
import type {
  GroupLeaderboardEntry,
  GroupLeaderboardType,
  GroupLeaderboardPeriod,
} from '../../services/groupService';
import { SkeletonBox } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = '#EFBF04';
const SILVER = '#9CA3AF';
const BRONZE = '#D97706';

const TYPE_PILLS: { value: GroupLeaderboardType; label: string }[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'sessions', label: 'Séances' },
  { value: 'streak', label: 'Streak' },
];

const PERIOD_PILLS: { value: GroupLeaderboardPeriod; label: string }[] = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'all', label: 'Tout' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? GOLD : 'rgba(255,255,255,0.06)',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontFamily: active ? 'Quilon-Medium' : 'Rowan-Regular',
          color: active ? '#000' : 'rgba(255,255,255,0.6)',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

function EntryRow({ entry }: { entry: GroupLeaderboardEntry }) {
  const color = rankColor(entry.rank);
  const isTop3 = entry.rank <= 3;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: entry.isCurrentUser
          ? 'rgba(239,191,4,0.08)'
          : 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: isTop3 ? 12 : 10,
        marginBottom: 8,
        gap: 10,
        borderWidth: entry.isCurrentUser ? 1 : 0,
        borderColor: entry.isCurrentUser ? 'rgba(239,191,4,0.25)' : 'transparent',
      }}
    >
      {/* Rank badge */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: isTop3 ? 2 : 0,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color,
            fontFamily: isTop3 ? 'Quilon-Medium' : 'Rowan-Regular',
            fontSize: isTop3 ? 14 : 13,
          }}
        >
          {rankLabel(entry.rank)}
        </Text>
      </View>

      {/* Avatar circle */}
      <View
        style={{
          width: isTop3 ? 40 : 32,
          height: isTop3 ? 40 : 32,
          borderRadius: isTop3 ? 20 : 16,
          backgroundColor: 'rgba(239,191,4,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isTop3 ? 2 : 0,
          borderColor: isTop3 ? color : 'transparent',
        }}
      >
        <Text style={{ color: GOLD, fontFamily: 'Quilon-Medium', fontSize: isTop3 ? 13 : 11 }}>
          {entry.username.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name */}
      <Text
        style={{
          flex: 1,
          color: '#fafafa',
          fontFamily: entry.isCurrentUser ? 'Quilon-Medium' : 'Rowan-Regular',
          fontSize: isTop3 ? 14 : 13,
        }}
        numberOfLines={1}
      >
        {entry.username}
        {entry.isCurrentUser ? ' (vous)' : ''}
      </Text>

      {/* Score */}
      <Text
        style={{
          color: isTop3 ? color : 'rgba(255,255,255,0.7)',
          fontFamily: 'Quilon-Medium',
          fontSize: isTop3 ? 16 : 13,
        }}
      >
        {entry.score}
      </Text>
    </View>
  );
}

function LeaderboardSkeleton() {
  return (
    <View style={{ gap: 8, marginTop: 4 }}>
      {[1, 2, 3].map((i) => (
        <SkeletonBox key={i} width="100%" height={52} borderRadius={12} />
      ))}
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface GroupLeaderboardTabProps {
  groupId: string;
}

export default function GroupLeaderboardTab({ groupId }: GroupLeaderboardTabProps) {
  const [selectedType, setSelectedType] = useState<GroupLeaderboardType>('volume');
  const [selectedPeriod, setSelectedPeriod] = useState<GroupLeaderboardPeriod>('week');
  const [entries, setEntries] = useState<GroupLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getGroupLeaderboard(groupId, selectedType, selectedPeriod);
    setEntries(data);
    setLoading(false);
  }, [groupId, selectedType, selectedPeriod]);

  useEffect(() => {
    load();
  }, [load]);

  const myEntry = entries.find((e) => e.isCurrentUser);
  const myEntryOutOfTop = myEntry !== undefined && !entries.slice(0, 10).includes(myEntry);

  return (
    <View style={{ flex: 1 }}>
      {/* Type pills */}
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 12, paddingBottom: 4 }}>
        {TYPE_PILLS.map((pill) => (
          <Pill
            key={pill.value}
            label={pill.label}
            active={selectedType === pill.value}
            onPress={() => setSelectedType(pill.value)}
          />
        ))}
      </View>

      {/* Period pills */}
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 8, paddingBottom: 12 }}>
        {PERIOD_PILLS.map((pill) => (
          <Pill
            key={pill.value}
            label={pill.label}
            active={selectedPeriod === pill.value}
            onPress={() => setSelectedPeriod(pill.value)}
          />
        ))}
      </View>

      {/* List */}
      {loading ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Aucune activité"
          description="Pas encore de données pour cette période."
          compact
        />
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {entries.map((entry) => (
              <EntryRow key={entry.userId} entry={entry} />
            ))}
          </ScrollView>

          {/* My position fixed at bottom if out of visible list */}
          {myEntryOutOfTop && myEntry !== undefined && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: 'rgba(239,191,4,0.2)',
                backgroundColor: 'rgba(239,191,4,0.06)',
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            >
              <EntryRow entry={myEntry} />
            </View>
          )}
        </>
      )}
    </View>
  );
}
