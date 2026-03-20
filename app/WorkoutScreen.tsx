import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ProgramCard from '../components/workout/ProgramCard';
import ExerciseCard from '../components/workout/ExerciseCard';
import { getPrograms, getProgramDetail, getExercises, getWorkoutSessions, getVolumeStats, getSessionsStats } from '../services/workoutService';
import type { WeeklyStats } from '../services/workoutService';
import HubTabNavigation from '../components/ui/HubTabNavigation';
import VolumeAreaChart from '../components/charts/VolumeAreaChart';
import SessionsBarChart from '../components/charts/SessionsBarChart';
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
  { id: 'methode', label: 'Méthode' },
];

function ProgramsListScreen({ navigation }: NativeStackScreenProps<WorkoutStackParamList, "ProgramsList">) {
  const insets = useSafeAreaInsets();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [volumeStats, setVolumeStats] = useState<WeeklyStats[]>([]);
  const [sessionsStats, setSessionsStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('programmes');

  useEffect(() => {
    Promise.all([getPrograms(), getExercises(), getWorkoutSessions(), getVolumeStats(), getSessionsStats()])
      .then(([p, e, s, vs, ss]) => {
        setPrograms(p);
        setExercises(e);
        setSessions(s);
        setVolumeStats(vs);
        setSessionsStats(ss);
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
    <View style={{ paddingTop: insets.top + 16, paddingBottom: 16 }}>
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
    const StatsHeader = (
      <>
        {ListHeader}
        <View className="mb-6">
          <Text className="text-white text-body-sm font-heading mb-4">Statistiques</Text>
          <VolumeAreaChart data={volumeStats} />
          <View className="mt-4">
            <SessionsBarChart data={sessionsStats} />
          </View>
        </View>
      </>
    );

    return (
      <View className="flex-1 bg-background">
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6"
          ListHeaderComponent={StatsHeader}
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

  if (activeTab === 'methode') {
    const methodeCards = [
      {
        icon: '📈',
        title: 'Périodisation',
        description: 'Progression systématique semaine après semaine. Chaque programme suit un plan d\'entraînement précis pour maximiser vos gains.',
      },
      {
        icon: '🔄',
        title: 'Rotation des cycles',
        description: 'Alterner entre différents types de séances (force, hypertrophie, puissance) pour stimuler tous vos systèmes énergétiques.',
      },
      {
        icon: '🏆',
        title: 'Tracking des PRs',
        description: 'Chaque personal record est enregistré. Surpassez-vous à chaque séance et voyez votre progression en temps réel.',
      },
    ];

    return (
      <View className="flex-1 bg-background">
        <ScrollView contentContainerClassName="px-4 pb-6">
          <View style={{ paddingTop: insets.top + 16, paddingBottom: 16 }}>
            <Text className="text-white text-h2 font-heading mb-6">Workout</Text>
            <HubTabNavigation tabs={HUB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </View>
          <Text className="text-white text-h2 font-heading mb-6">La Méthode Ironeo</Text>
          {methodeCards.map((card) => (
            <View key={card.title} className="bg-white/[0.04] rounded-2xl p-5 mb-4">
              <Text style={{ fontSize: 40, marginBottom: 12 }}>{card.icon}</Text>
              <Text className="text-white text-body-sm font-heading mb-2">{card.title}</Text>
              <Text className="text-white/40 text-caption font-body">{card.description}</Text>
            </View>
          ))}
        </ScrollView>
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
  const insets = useSafeAreaInsets();
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
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 24 }}>
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
