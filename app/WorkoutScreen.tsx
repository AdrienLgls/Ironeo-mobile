import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ProgramCard from '../components/workout/ProgramCard';
import ExerciseCard from '../components/workout/ExerciseCard';
import { getPrograms, getProgramDetail } from '../services/workoutService';
import ActiveSessionScreen from './ActiveSessionScreen';
import PostSessionScreen from './PostSessionScreen';
import ExercisesScreen from './ExercisesScreen';
import ExerciseDetailScreen from './ExerciseDetailScreen';
import HistoryScreen from './HistoryScreen';
import type { Program, ProgramDetail, ProgramDay } from '../types/workout';

export type WorkoutStackParamList = {
  ProgramsList: undefined;
  ProgramDetail: { programId: string };
  ActiveSession: { program: import('../types/workout').ProgramDetail };
  PostSession: { sessionId: string };
  ExercisesList: undefined;
  ExerciseDetail: { exerciseId: string };
  History: undefined;
};

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

function ProgramsListScreen({ navigation }: NativeStackScreenProps<WorkoutStackParamList, "ProgramsList">) {
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
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-2xl font-bold">Programs</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
                <Text className="text-white/50 text-sm">History</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ExercisesList')} activeOpacity={0.7}>
                <Text className="text-accent text-sm">Exercises</Text>
              </TouchableOpacity>
            </View>
          </View>
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

type ProgramDetailProps = NativeStackScreenProps<WorkoutStackParamList, 'ProgramDetail'>;

function ProgramDetailScreen({ route, navigation }: ProgramDetailProps) {
  const { programId } = route.params;
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProgramDetail(programId)
      .then(setProgram)
      .catch(() => setError('Unable to load program'))
      .finally(() => setLoading(false));
  }, [programId]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  if (error || !program) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-red-400 text-sm">{error ?? 'Program not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-6">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
        <Text className="text-accent text-sm">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-2xl font-bold mb-1">{program.name}</Text>
      <Text className="text-white/40 text-xs mb-6">
        {program.daysPerWeek}×/week · {program.durationWeeks} weeks
      </Text>

      {program.days.map((day: ProgramDay) => (
        <View key={day.dayNumber} className="mb-6">
          <Text className="text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            {day.label}
          </Text>
          <View className="bg-white/[0.04] rounded-2xl px-4">
            {day.exercises.map((ex, idx) => (
              <ExerciseCard key={ex.exerciseId} exercise={ex} index={idx} />
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity
        className="bg-accent rounded-2xl py-4 items-center mt-2"
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ActiveSession', { program })}
      >
        <Text className="text-black font-bold text-base">Start Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function WorkoutScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramsList" component={ProgramsListScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen
        name="ActiveSession"
        children={({ route, navigation }) => (
          <ActiveSessionScreen program={route.params.program} route={route} navigation={navigation} />
        )}
      />
      <Stack.Screen name="PostSession" component={PostSessionScreen} />
      <Stack.Screen name="ExercisesList" component={ExercisesScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}
