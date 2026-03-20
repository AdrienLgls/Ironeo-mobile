import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { getExercises } from '../services/workoutService';
import ExerciseGridCard from '../components/workout/ExerciseGridCard';
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
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
              <Text className="text-accent text-body-sm font-body">← Retour</Text>
            </TouchableOpacity>
            <Text className="text-white text-h2 font-heading mb-4">Exercices</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#fff',
                fontFamily: 'Rowan-Regular',
                fontSize: 15,
                marginBottom: 10,
              }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity
                    key={group}
                    activeOpacity={0.7}
                    onPress={() => setActiveGroup(activeGroup === group ? null : group)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: activeGroup === group ? '#EFBF04' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Rowan-Regular',
                      fontSize: 12,
                      textTransform: 'capitalize',
                      color: activeGroup === group ? '#000' : 'rgba(255,255,255,0.6)',
                    }}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16 }}>
            <Text className="text-white/40 text-body-sm font-body text-center mt-8">
              {error ?? 'Aucun exercice trouvé'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExerciseGridCard
            exercise={item}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
          />
        )}
      />
    </View>
  );
}
