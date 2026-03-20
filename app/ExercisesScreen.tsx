import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { getExercises } from '../services/workoutService';
import type { Exercise } from '../types/workout';

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'arms', 'shoulders', 'core'] as const;

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExercisesList'>;

export default function ExercisesScreen({ navigation }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
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
    setFiltered(
      exercises.filter((ex) => {
        const matchesSearch = !q || ex.name.toLowerCase().includes(q);
        const matchesGroup = !activeGroup || ex.muscleGroups.some((g) => g.toLowerCase() === activeGroup);
        return matchesSearch && matchesGroup;
      })
    );
  }, [search, activeGroup, exercises]);

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
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3">
              <Text className="text-accent text-body-sm font-body">← Back</Text>
            </TouchableOpacity>
            <Text className="text-white text-h2 font-heading mb-4">Exercises</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="bg-white/[0.06] rounded-xl px-4 py-3 text-white text-sm mb-3"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {MUSCLE_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group}
                  activeOpacity={0.7}
                  onPress={() => setActiveGroup(activeGroup === group ? null : group)}
                  className={`mr-2 px-3 py-1.5 rounded-full ${activeGroup === group ? 'bg-accent' : 'bg-white/[0.08]'}`}
                >
                  <Text className={`text-caption font-body capitalize ${activeGroup === group ? 'text-black' : 'text-white/60'}`}>
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <Text className="text-white/40 text-body-sm font-body text-center mt-8">
            {error ?? 'No exercises found'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
            className="flex-row items-center py-4 border-b border-white/[0.05]"
          >
            <View className="flex-1">
              <Text className="text-white text-body-sm font-body">{item.name}</Text>
              {item.muscleGroups.length > 0 && (
                <Text className="text-white/40 text-caption font-body mt-0.5">
                  {item.muscleGroups.join(' · ')}
                </Text>
              )}
            </View>
            <Text className="text-white/20 text-caption font-body">›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
