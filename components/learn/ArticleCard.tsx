import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { Article } from '../../types/learn';

interface Props {
  article: Article;
  onPress: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  technique: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  nutrition: { bg: 'rgba(34,197,94,0.2)', text: '#4ADE80' },
  mentalite: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  anatomie: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
  récupération: { bg: 'rgba(20,184,166,0.2)', text: '#2DD4BF' },
};

function getCategoryStyle(category: string) {
  const key = category.toLowerCase().replace(/é/g, 'e');
  return CATEGORY_COLORS[key] ?? { bg: 'rgba(239,191,4,0.2)', text: '#EFBF04' };
}

export default function ArticleCard({ article, onPress }: Props) {
  const catStyle = getCategoryStyle(article.category);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Cover image */}
      {article.imageUrl ? (
        <Image
          source={{ uri: article.imageUrl }}
          style={{ width: '100%', height: 140 }}
          resizeMode="cover"
        />
      ) : null}

      {/* Content */}
      <View style={{ padding: 14 }}>
        {/* Category + read time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ backgroundColor: catStyle.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: catStyle.text, fontFamily: 'Rowan-Regular', fontSize: 11, textTransform: 'capitalize' }}>
              {article.category}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rowan-Regular', fontSize: 11 }}>
            {article.readTimeMinutes} min
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{ color: '#fff', fontFamily: 'Quilon-Medium', fontSize: 16, lineHeight: 22, marginBottom: 4 }}
          numberOfLines={2}
        >
          {article.title}
        </Text>

        {/* Summary */}
        {article.summary && (
          <Text
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Rowan-Regular', fontSize: 13, lineHeight: 18 }}
            numberOfLines={2}
          >
            {article.summary}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
