import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LearnStackParamList } from './LearnScreen';
import { getParcoursDetail } from '../services/parcoursService';
import type { ParcoursDetailType, ParcoursArticle } from '../types/learn';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonBox } from '../components/ui/Skeleton';

function ArticleStatusBadge({ article }: { article: ParcoursArticle }) {
  if (article.isCompleted) {
    return (
      <View style={{ backgroundColor: 'rgba(239,191,4,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 11 }}>Complété</Text>
      </View>
    );
  }
  if (article.isLocked) {
    return (
      <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rowan-Regular', fontSize: 11 }}>Verrouillé</Text>
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Rowan-Regular', fontSize: 11 }}>Disponible</Text>
    </View>
  );
}

function DetailSkeleton({ top }: { top: number }) {
  return (
    <View style={{ paddingTop: top + 16, paddingHorizontal: 16 }}>
      <SkeletonBox height={20} width={60} borderRadius={6} style={{ marginBottom: 24 }} />
      <SkeletonBox height={28} borderRadius={8} style={{ marginBottom: 8 }} />
      <SkeletonBox height={14} width="70%" borderRadius={6} style={{ marginBottom: 24 }} />
      {[0, 1, 2, 3].map((i) => (
        <SkeletonBox key={i} height={60} borderRadius={12} style={{ marginBottom: 10 }} />
      ))}
    </View>
  );
}

export default function ParcoursDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'ParcoursDetail'>) {
  const { parcoursSlug, parcoursTitle } = route.params;
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<ParcoursDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getParcoursDetail(parcoursSlug)
      .then(setDetail)
      .catch(() => setError('Impossible de charger le parcours'))
      .finally(() => setLoading(false));
  }, [parcoursSlug]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212' }}>
        <DetailSkeleton top={insets.top} />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
        <EmptyState
          icon="⚠️"
          title={error ?? 'Parcours introuvable'}
          type="error"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#121212' }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
        <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 14 }}>← Retour</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 22, lineHeight: 28, marginBottom: 8 }}>
        {detail.title}
      </Text>
      {detail.description != null && detail.description.length > 0 && (
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
          {detail.description}
        </Text>
      )}

      <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rowan-Regular', fontSize: 12, marginBottom: 16 }}>
        {detail.articles.length} article{detail.articles.length !== 1 ? 's' : ''}
      </Text>

      {/* Articles list */}
      {detail.articles.length === 0 ? (
        <EmptyState
          icon="📖"
          title="Aucun article dans ce parcours"
          compact
        />
      ) : (
        detail.articles.map((article, index) => (
          <View key={article.id} style={{ position: 'relative', marginBottom: 10 }}>
          <TouchableOpacity
            activeOpacity={article.isLocked ? 1 : 0.7}
            onPress={() => {
              if (!article.isLocked) {
                navigation.navigate('ArticleDetail', { articleId: article.id });
              }
            }}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: article.isLocked ? 0.5 : 1,
              overflow: 'hidden',
            }}
          >
            {/* Order number */}
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: article.isCompleted ? '#EFBF04' : 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                color: article.isCompleted ? '#121212' : 'rgba(255,255,255,0.4)',
                fontFamily: 'Quilon-Medium',
                fontSize: 12,
              }}>
                {article.isCompleted ? '✓' : String(index + 1)}
              </Text>
            </View>

            {/* Title */}
            <Text style={{
              flex: 1,
              color: article.isLocked ? 'rgba(255,255,255,0.3)' : '#fafafa',
              fontFamily: 'Quilon-Medium',
              fontSize: 14,
              lineHeight: 18,
            }}>
              {article.title}
            </Text>

            {/* Status badge */}
            <ArticleStatusBadge article={article} />
            {/* Locked fade overlay */}
            {article.isLocked && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 32,
                  backgroundColor: 'rgba(18,18,18,0.6)',
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                }}
              />
            )}
          </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}
