import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ProgramCard from '../components/workout/ProgramCard';
import ExerciseCard from '../components/workout/ExerciseCard';
import { getPrograms, getProgramDetail, getExercises, getWorkoutSessions } from '../services/workoutService';
import HubTabNavigation from '../components/ui/HubTabNavigation';
import ActiveSessionScreen from './ActiveSessionScreen';
import PostSessionScreen from './PostSessionScreen';
import ExercisesScreen from './ExercisesScreen';
import ExerciseDetailScreen from './ExerciseDetailScreen';
import HistoryScreen from './HistoryScreen';
import type { Program, ProgramDetail, ProgramDay, Exercise, WorkoutSession } from '../types/workout';

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

const HUB_TABS = [
  { id: 'programmes', label: 'Programmes' },
  { id: 'exercices', label: 'Exercices' },
  { id: 'historique', label: 'Historique' },
];

function ProgramsListScreen({ navigation }: NativeStackScreenProps<WorkoutStackParamList, "ProgramsList">) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('programmes');

  useEffect(() => {
    Promise.all([getPrograms(), getExercises(), getWorkoutSessions()])
      .then(([p, e, s]) => {
        setPrograms(p);
        setExercises(e);
        setSessions(s);
      })
      .catch(() => setError('Unable to load data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  const ListHeader = (
    <View className="pt-12 pb-4">
      <Text className="text-white text-h2 font-heading mb-6">Workout</Text>
      <HubTabNavigation tabs={HUB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );

  if (activeTab === 'exercices') {
    return (
      <View className="flex-1 bg-background">
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6"
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            error ? (
              <Text className="text-red-400 text-body-sm font-body text-center mt-8">{error}</Text>
            ) : (
              <Text className="text-white/40 text-body-sm font-body text-center mt-8">No exercises available</Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white/[0.04] rounded-2xl p-4 mb-3"
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
            >
              <Text className="text-white text-body-sm font-heading mb-2">{item.name}</Text>
              <View className="flex-row flex-wrap gap-2">
                {item.muscleGroups.map((group) => (
                  <View key={group} className="bg-white/[0.08] rounded-full px-2 py-1">
                    <Text className="text-white/60 text-caption font-body">{group}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (activeTab === 'historique') {
    return (
      <View className="flex-1 bg-background">
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6"
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            error ? (
              <Text className="text-red-400 text-body-sm font-body text-center mt-8">{error}</Text>
            ) : (
              <Text className="text-white/40 text-body-sm font-body text-center mt-8">No sessions yet</Text>
            )
          }
          renderItem={({ item }) => {
            const date = new Date(item.startedAt).toLocaleDateString('fr-CA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            return (
              <View className="bg-white/[0.04] rounded-2xl p-4 mb-3">
                <Text className="text-white text-body-sm font-heading mb-1">{item.programName}</Text>
                <Text className="text-white/40 text-caption font-body">
                  {date}{item.durationMinutes != null ? ` · ${item.durationMinutes} min` : ''}
                </Text>
              </View>
            );
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          error ? (
            <Text className="text-red-400 text-body-sm font-body text-center mt-8">{error}</Text>
          ) : (
            <Text className="text-white/40 text-body-sm font-body text-center mt-8">No programs available</Text>
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
        <Text className="text-red-400 text-body-sm font-body">{error ?? 'Program not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-6">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-1">{program.name}</Text>
      <Text className="text-white/40 text-caption font-body mb-6">
        {program.daysPerWeek}×/week · {program.durationWeeks} weeks
      </Text>

      {program.days.map((day: ProgramDay) => (
        <View key={day.dayNumber} className="mb-6">
          <Text className="text-accent text-overline font-body uppercase tracking-wider mb-2">
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
        <Text className="text-black text-body font-heading">Start Session</Text>
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
