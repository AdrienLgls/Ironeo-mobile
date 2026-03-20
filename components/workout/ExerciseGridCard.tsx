import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { Exercise } from '../../types/workout';

interface Props {
  exercise: Exercise;
  onPress: () => void;
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#EF4444',
  back: '#3B82F6',
  legs: '#22C55E',
  arms: '#F59E0B',
  shoulders: '#8B5CF6',
  core: '#EC4899',
  glutes: '#14B8A6',
  biceps: '#F59E0B',
  triceps: '#F97316',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  'Débutant': '#22C55E',
  'Intermédiaire': '#F59E0B',
  'Avancé': '#EF4444',
};

export default function ExerciseGridCard({ exercise, onPress }: Props) {
  const difficultyColor = DIFFICULTY_COLORS[exercise.difficulty ?? 'Débutant'] ?? '#6B7280';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flex: 1,
        margin: 4,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      {exercise.imageUrl ? (
        <View style={{ height: 100, width: '100%', overflow: 'hidden' }}>
          <Image
            source={{ uri: exercise.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Category badge over image */}
          {exercise.category && (
            <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 10 }}>
                {exercise.category}
              </Text>
            </View>
          )}
          {/* Difficulty badge */}
          {exercise.difficulty && (
            <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 3 }}>
              <Text style={{ color: difficultyColor, fontFamily: 'Rowan-Regular', fontSize: 10 }}>
                {exercise.difficulty}
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* No image: category + difficulty in header row */
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, paddingBottom: 0 }}>
          {exercise.category && (
            <View style={{ backgroundColor: 'rgba(239,191,4,0.15)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 10 }}>
                {exercise.category}
              </Text>
            </View>
          )}
          {exercise.difficulty && (
            <View style={{ backgroundColor: `${difficultyColor}22`, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 3 }}>
              <Text style={{ color: difficultyColor, fontFamily: 'Rowan-Regular', fontSize: 10 }}>
                {exercise.difficulty}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View style={{ padding: 10 }}>
        <Text
          style={{ color: '#fff', fontFamily: 'Quilon-Medium', fontSize: 14, marginBottom: 6, lineHeight: 18 }}
          numberOfLines={2}
        >
          {exercise.name}
        </Text>

        {/* Muscle group chips */}
        {exercise.muscleGroups.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
            {exercise.muscleGroups.slice(0, 3).map((mg) => {
              const color = MUSCLE_COLORS[mg.toLowerCase()] ?? '#6B7280';
              return (
                <View key={mg} style={{ backgroundColor: `${color}22`, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                  <Text style={{ color, fontFamily: 'Rowan-Regular', fontSize: 9 }}>
                    {mg}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
