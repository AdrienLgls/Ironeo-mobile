import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getWorkoutSessions } from '../services/workoutService';
import type { WorkoutSession } from '../types/workout';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { formatDate, formatVolume } from '../utils/formatters';

// Matches web SessionDetail link list — date fr-FR, durée, volume, exercices

type HistoryNav = NativeStackNavigationProp<WorkoutStackParamList, 'History'>;

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HistoryNav>();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions(pageNum: number, replace = false) {
    if (loadingMore && !replace) return;
    setError(null);
    setLoadingMore(true);
    try {
      const data = await getWorkoutSessions(pageNum, PAGE_SIZE);
      if (replace) {
        setSessions(data);
      } else {
        setSessions(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    } catch {
      setError("Impossible de charger l'historique");
    } finally {
      setLoadingMore(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadSessions(1, true); }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadSessions(1, true);
  }

  function handleLoadMore() {
    if (hasMore && !loadingMore) {
      loadSessions(page + 1);
    }
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EFBF04" />
      }
      ListHeaderComponent={
        <Text style={[styles.title, { paddingTop: insets.top + 16 }]}>Historique</Text>
      }
      ListEmptyComponent={
        !loadingMore ? (
          <Text style={styles.empty}>{error ?? "Aucune séance pour l'instant"}</Text>
        ) : null
      }
      ListFooterComponent={
        loadingMore && !refreshing ? (
          <View style={styles.footer}>
            <ActivityIndicator color="#EFBF04" />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const totalVolume = item.exercises.flatMap((e) => e.sets).reduce(
          (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
          0
        );
        const completedSets = item.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length;
        const exNames = item.exercises.slice(0, 3).map((e) => e.exerciseName ?? '?');
        const extraCount = Math.max(0, item.exercises.length - 3);

        return (
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.card}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.programName} numberOfLines={1}>
                  {item.programName ?? 'Séance libre'}
                </Text>
                <Text style={styles.dateText}>{formatDate(item.startedAt)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>

            <View style={styles.cardBottom}>
              {completedSets > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{completedSets} sets</Text>
                </View>
              )}
              {item.durationMinutes != null && item.durationMinutes > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.durationMinutes} min</Text>
                </View>
              )}
              {totalVolume > 0 && (
                <View style={[styles.badge, styles.badgeGold]}>
                  <Text style={[styles.badgeText, styles.badgeTextGold]}>{formatVolume(totalVolume)}</Text>
                </View>
              )}
            </View>

            {exNames.length > 0 && (
              <Text style={styles.exNames} numberOfLines={1}>
                {exNames.join(' · ')}{extraCount > 0 ? ` +${extraCount}` : ''}
              </Text>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  title: { fontFamily: 'Quilon-Medium', fontSize: 25, color: '#fafafa', marginBottom: 16 },
  empty: { fontFamily: 'Rowan-Regular', fontSize: 14, color: '#a0a0a0', textAlign: 'center', marginTop: 32 },
  footer: { paddingVertical: 16, alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft: { flex: 1 },
  programName: { fontFamily: 'Quilon-Medium', fontSize: 15, color: '#fafafa', marginBottom: 2 },
  dateText: { fontFamily: 'Rowan-Regular', fontSize: 13, color: '#a0a0a0' },
  chevron: { fontSize: 20, color: '#a0a0a0', marginLeft: 8 },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeGold: { backgroundColor: 'rgba(239,191,4,0.15)' },
  badgeText: { fontFamily: 'Rowan-Regular', fontSize: 12, color: '#a0a0a0' },
  badgeTextGold: { color: '#EFBF04' },
  exNames: { fontFamily: 'Rowan-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});
