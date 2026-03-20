import React from 'react';
import { View, FlatList } from 'react-native';
import type { Parcours } from '../../types/learn';
import ParcoursCard from './ParcoursCard';
import EmptyState from '../ui/EmptyState';
import { SkeletonBox } from '../ui/Skeleton';

interface Props {
  parcours: Parcours[];
  loading: boolean;
  onPress: (parcours: Parcours) => void;
}

function ParcoursSkeletons() {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {[0, 1, 2].map((i) => (
        <SkeletonBox key={i} height={80} borderRadius={16} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

export default function ParcoursListTab({ parcours, loading, onPress }: Props) {
  if (loading) {
    return <ParcoursSkeletons />;
  }

  if (parcours.length === 0) {
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <EmptyState
          icon="📚"
          title="Aucun parcours disponible"
          description="Les parcours d'apprentissage arrivent bientôt."
        />
      </View>
    );
  }

  return (
    <FlatList
      data={parcours}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ParcoursCard
          parcours={item}
          onPress={() => onPress(item)}
        />
      )}
    />
  );
}
