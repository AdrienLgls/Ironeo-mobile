import React, { useEffect, useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutStackParamList } from './WorkoutScreen';
import { getExercises } from '../services/workoutService';
import ExerciseGridCard from '../components/workout/ExerciseGridCard';
import EmptyState from '../components/ui/EmptyState';
import type { Exercise } from '../types/workout';

const MUSCLE_GROUPS = ['Tous', 'chest', 'back', 'legs', 'arms', 'shoulders', 'core'] as const;
const EQUIPMENT_FILTERS = ['Tous', 'Haltères', 'Barre', 'Machine', 'Poids corps', 'Élastique'] as const;

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ExercisesList'>;

export default function ExercisesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('Tous');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Tous');

  useEffect(() => {
    getExercises()
      .then((data) => setExercises(data))
      .catch(() => setError('Unable to load exercises'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        !debouncedSearch ||
        ex.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        ex.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        activeGroup === 'Tous' || ex.muscleGroups.some((g) => g.toLowerCase() === activeGroup);
      const matchesEquipment =
        selectedEquipment === 'Tous' ||
        ex.equipment?.toLowerCase().includes(selectedEquipment.toLowerCase());
      return matchesSearch && matchesCategory && matchesEquipment;
    });
  }, [exercises, debouncedSearch, activeGroup, selectedEquipment]);

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
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
              <Text className="text-accent text-body-sm font-body">← Retour</Text>
            </TouchableOpacity>
            <Text className="text-white text-h2 font-heading mb-4">Exercices</Text>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un exercice..."
                placeholderTextColor="#a0a0a0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Category filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
            >
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity
                    key={group}
                    activeOpacity={0.7}
                    onPress={() => setActiveGroup(group)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor:
                        activeGroup === group ? '#EFBF04' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Rowan-Regular',
                        fontSize: 12,
                        textTransform: 'capitalize',
                        color: activeGroup === group ? '#000' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Equipment filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 4 }}
            >
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {EQUIPMENT_FILTERS.map((equip) => (
                  <TouchableOpacity
                    key={equip}
                    activeOpacity={0.7}
                    onPress={() => setSelectedEquipment(equip)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor:
                        selectedEquipment === equip ? '#EFBF04' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Rowan-Regular',
                        fontSize: 12,
                        color: selectedEquipment === equip ? '#000' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {equip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16 }}>
            {error ? (
              <EmptyState
                icon="⚠️"
                title="Erreur de chargement"
                description="Vérifiez votre connexion internet"
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Aucun exercice trouvé"
                description="Essaie avec d'autres mots-clés ou filtres"
                compact
              />
            )}
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

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 15,
  },
});
