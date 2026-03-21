import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityItem, getActivityFeed, sendBravo } from '../../services/socialService';
import EmptyState from '../ui/EmptyState';
import { SkeletonBox } from '../ui/Skeleton';
import { formatRelativeTime } from '../../utils/formatters';

function getActivityDescription(item: ActivityItem): string {
  const d = item.data;
  switch (item.type) {
    case 'workout_completed':
      return `A terminé une séance · ${String(d.programName ?? '')} · ${String(d.sets ?? '')} sets · ${String(d.volume ?? '')}kg`;
    case 'personal_record':
      return `A battu un record 🏆 · ${String(d.exerciseName ?? '')} · ${String(d.weight ?? '')}kg`;
    case 'streak_milestone':
      return `🔥 ${String(d.days ?? '')} jours consécutifs!`;
    case 'badge_earned':
      return `A obtenu le badge · ${String(d.badgeName ?? '')}`;
    case 'article_finished':
      return `A terminé l'article · ${String(d.articleTitle ?? '')}`;
    case 'parcours_completed':
      return `A complété le parcours · ${String(d.parcoursTitle ?? '')}`;
    case 'member_joined':
      return `A rejoint le groupe · ${String(d.groupName ?? '')}`;
  }
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function getTypeIcon(type: ActivityItem['type']): { name: IoniconName; color: string } {
  switch (type) {
    case 'workout_completed':
      return { name: 'barbell', color: '#fafafa' };
    case 'personal_record':
      return { name: 'trophy', color: '#EFBF04' };
    case 'streak_milestone':
      return { name: 'flame', color: '#f97316' };
    case 'badge_earned':
      return { name: 'ribbon', color: '#a855f7' };
    case 'article_finished':
      return { name: 'book', color: '#3b82f6' };
    case 'parcours_completed':
      return { name: 'checkmark-circle', color: '#22c55e' };
    case 'member_joined':
      return { name: 'people', color: '#6366f1' };
  }
}

// ---------------------------------------------------------------------------
// BravoButton
// ---------------------------------------------------------------------------

interface BravoButtonProps {
  activityId: string;
  count: number;
  hasBravoed: boolean;
  onToggle: (id: string) => void;
}

function BravoButton({ activityId, count, hasBravoed, onToggle }: BravoButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onToggle(activityId);
  }, [scale, onToggle, activityId]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.bravoButton}>
      <Animated.View style={[styles.bravoInner, { transform: [{ scale }] }]}>
        <Text style={[styles.bravoEmoji]}>👏</Text>
        <Text style={[styles.bravoCount, hasBravoed ? styles.bravoActive : styles.bravoMuted]}>
          {count} bravos
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// ActivityCard
// ---------------------------------------------------------------------------

interface ActivityCardProps {
  item: ActivityItem;
  onBravoToggle: (id: string) => void;
}

function ActivityCard({ item, onBravoToggle }: ActivityCardProps) {
  const icon = getTypeIcon(item.type);
  const initials = item.userPseudo.slice(0, 2).toUpperCase();

  return (
    <View style={styles.card}>
      {/* Top row: avatar + pseudo + timestamp */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardHeaderMiddle}>
          <Text style={styles.pseudo}>{item.userPseudo}</Text>
          {/* Activity description row */}
          <View style={styles.descRow}>
            <Ionicons name={icon.name} size={13} color={icon.color} style={styles.typeIcon} />
            <Text style={styles.description} numberOfLines={2}>
              {getActivityDescription(item)}
            </Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
      </View>

      {/* Bravo */}
      <BravoButton
        activityId={item._id}
        count={item.bravoCount}
        hasBravoed={item.hasBravoed}
        onToggle={onBravoToggle}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ActivityFeedScreen
// ---------------------------------------------------------------------------

export default function ActivityFeedScreen() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (nextPage: number, replace: boolean) => {
    if (nextPage === 0) {
      replace ? setRefreshing(true) : setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const fetched = await getActivityFeed(nextPage);
      setItems(prev => (replace || nextPage === 0 ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length > 0);
      setPage(nextPage);
    } catch {
      if (nextPage === 0) {
        setError("Impossible de charger l'activité de tes amis");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(0, false);
  }, [loadFeed]);

  const handleRefresh = useCallback(() => {
    loadFeed(0, true);
  }, [loadFeed]);

  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadFeed(page + 1, false);
    }
  }, [loadingMore, hasMore, page, loadFeed]);

  const handleBravoToggle = useCallback((id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item._id !== id) return item;
        const nowBravoed = !item.hasBravoed;
        return {
          ...item,
          hasBravoed: nowBravoed,
          bravoCount: item.bravoCount + (nowBravoed ? 1 : -1),
        };
      })
    );
    sendBravo(id).catch(() => {
      // Revert optimistic update on failure
      setItems(prev =>
        prev.map(item => {
          if (item._id !== id) return item;
          const revert = !item.hasBravoed;
          return {
            ...item,
            hasBravoed: revert,
            bravoCount: item.bravoCount + (revert ? 1 : -1),
          };
        })
      );
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ActivityItem }) => (
      <ActivityCard item={item} onBravoToggle={handleBravoToggle} />
    ),
    [handleBravoToggle]
  );

  const keyExtractor = useCallback((item: ActivityItem) => item._id, []);

  const ListFooter = loadingMore ? (
    <View style={styles.footerLoader}>
      <SkeletonBox width="100%" height={72} borderRadius={12} />
    </View>
  ) : null;

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[0, 1, 2].map(i => (
          <SkeletonBox key={i} width="100%" height={72} borderRadius={12} style={styles.skeletonItem} />
        ))}
      </View>
    );
  }

  if (error !== null) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          icon="⚠️"
          title="Erreur de chargement"
          description={error}
          type="error"
        />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={
        <EmptyState
          icon="👥"
          title="Aucune activité"
          description="Ajoutez des amis pour voir leur progression ici."
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#EFBF04"
        />
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  skeletonContainer: {
    padding: 16,
    gap: 10,
  },
  skeletonItem: {
    marginBottom: 10,
  },
  footerLoader: {
    paddingVertical: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239,191,4,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: '#EFBF04',
  },
  cardHeaderMiddle: {
    flex: 1,
  },
  pseudo: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: '#fafafa',
    marginBottom: 3,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  typeIcon: {
    flexShrink: 0,
  },
  description: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: '#a0a0a0',
    flex: 1,
  },
  timestamp: {
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    color: '#666',
    flexShrink: 0,
    marginTop: 2,
  },
  bravoButton: {
    alignSelf: 'flex-start',
    marginLeft: 50,
  },
  bravoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bravoEmoji: {
    fontSize: 14,
  },
  bravoCount: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
  },
  bravoActive: {
    color: '#EFBF04',
  },
  bravoMuted: {
    color: '#666',
  },
});
