import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getExercises } from '../services/workoutService';
import type { Exercise } from '../types/workout';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExercises()
      .then((data) => {
        setExercises(data);
        setFiltered(data);
      })
      .catch(() => setError('Unable to load exercises'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q ? exercises.filter((ex) => ex.name.toLowerCase().includes(q)) : exercises);
  }, [search, exercises]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        ListHeaderComponent={
          <View className="pt-12 mb-4">
            <Text className="text-white text-2xl font-bold mb-4">Exercises</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="bg-white/[0.06] rounded-xl px-4 py-3 text-white text-sm"
            />
          </View>
        }
        ListEmptyComponent={
          <Text className="text-white/40 text-sm text-center mt-8">
            {error ?? 'No exercises found'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center py-4 border-b border-white/[0.05]"
          >
            <View className="flex-1">
              <Text className="text-white text-sm font-medium">{item.name}</Text>
              {item.muscleGroups.length > 0 && (
                <Text className="text-white/40 text-xs mt-0.5">
                  {item.muscleGroups.join(' · ')}
                </Text>
              )}
            </View>
            <Text className="text-white/20 text-xs">›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
