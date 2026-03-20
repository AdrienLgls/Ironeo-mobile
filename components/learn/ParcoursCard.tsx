import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Parcours } from '../../types/learn';

interface Props {
  parcours: Parcours;
  onPress: () => void;
}

const RING_SIZE = 40;
const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ParcoursCard({ parcours, onPress }: Props) {
  const progress = parcours.progress ?? 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Thumbnail */}
      {parcours.imageUrl ? (
        <Image
          source={{ uri: parcours.imageUrl }}
          style={{ width: 80, height: 80 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: 80, height: 80, backgroundColor: 'rgba(239,191,4,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>📚</Text>
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1, padding: 12 }}>
        <Text style={{ color: '#fff', fontFamily: 'Quilon-Medium', fontSize: 15, lineHeight: 20, marginBottom: 4 }} numberOfLines={2}>
          {parcours.title}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
          {parcours.articleCount} article{parcours.articleCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Progress ring */}
      <View style={{ paddingRight: 12, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
            <Circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
              fill="none"
              stroke="rgba(239,191,4,0.15)"
              strokeWidth={4}
            />
            <Circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
              fill="none"
              stroke="#EFBF04"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <View style={{ position: 'absolute' }}>
            <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 9 }}>
              {progress}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
