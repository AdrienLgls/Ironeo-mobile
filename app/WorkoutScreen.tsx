import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProgramCard from '../components/workout/ProgramCard';
import { getPrograms } from '../services/workoutService';
import type { Program } from '../types/workout';

export type WorkoutStackParamList = {
  ProgramsList: undefined;
  ProgramDetail: { programId: string };
};

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

function ProgramsListScreen({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPrograms()
      .then(setPrograms)
      .catch(() => setError('Unable to load programs'))
      .finally(() => setLoading(false));
  }, []);

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
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-12 pb-6"
        ListHeaderComponent={
          <Text className="text-white text-2xl font-bold mb-6">Programs</Text>
        }
        ListEmptyComponent={
          error ? (
            <Text className="text-red-400 text-sm text-center mt-8">{error}</Text>
          ) : (
            <Text className="text-white/40 text-sm text-center mt-8">No programs available</Text>
          )
        }
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            onPress={() => navigation.navigate('ProgramDetail', { programId: item.id })}
          />
        )}
      />
    </View>
  );
}

function ProgramDetailPlaceholder() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white/40">Program detail — coming soon</Text>
    </View>
  );
}

export default function WorkoutScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramsList" component={ProgramsListScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailPlaceholder} />
    </Stack.Navigator>
  );
}
