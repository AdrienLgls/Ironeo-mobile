import React, { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ProgramCard from '../components/workout/ProgramCard';
import ExerciseCard from '../components/workout/ExerciseCard';
import ExerciseCreatorModal from '../components/workout/ExerciseCreatorModal';
import { getPrograms, getProgramDetail, getExercises, getWorkoutSessions, getVolumeStats, getSessionsStats, unfollowProgram, deleteCustomExercise, getFollowedPrograms } from '../services/workoutService';
import type { WeeklyStats } from '../services/workoutService';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import HubTabNavigation from '../components/ui/HubTabNavigation';
import VolumeAreaChart from '../components/charts/VolumeAreaChart';
import SessionsBarChart from '../components/charts/SessionsBarChart';
import ActiveSessionScreen from './ActiveSessionScreen';
import PostSessionScreen from './PostSessionScreen';
import ExercisesScreen from './ExercisesScreen';
import ExerciseDetailScreen from './ExerciseDetailScreen';
import HistoryScreen from './HistoryScreen';
import SessionDetailScreen from './SessionDetailScreen';
import type { Program, ProgramDetail, ProgramDay, Exercise, WorkoutSession } from '../types/workout';
import { formatDate } from '../utils/formatters';

export type WorkoutStackParamList = {
  ProgramsList: undefined;
  ProgramDetail: { programId: string };
  ActiveSession: { program: import('../types/workout').ProgramDetail };
  PostSession: { sessionId: string };
  ExercisesList: undefined;
  ExerciseDetail: { exerciseId: string };
  History: undefined;
  SessionDetail: { sessionId: string };
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
  const confirm = useConfirm();
  const toast = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [volumeStats, setVolumeStats] = useState<WeeklyStats[]>([]);
  const [sessionsStats, setSessionsStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('programmes');
  const [creatorVisible, setCreatorVisible] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([getPrograms(), getExercises(), getWorkoutSessions(), getVolumeStats(), getSessionsStats()])
      .then(([p, e, s, vs, ss]) => {
        setPrograms(p);
        setExercises(e);
        setSessions(s);
        setVolumeStats(vs);
        setSessionsStats(ss);
      })
      .catch(() => setError('Unable to load data'));
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function handleDeleteExercise(id: string, name: string) {
    const ok = await confirm({
      title: 'Supprimer cet exercice ?',
      message: `"${name}" sera supprimé définitivement.`,
      confirmText: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCustomExercise(id);
      toast.success('Exercice supprimé');
      void loadData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

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
    const ExercisesHeader = (
      <>
        {ListHeader}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 13 }}>
            {exercises.length} exercice{exercises.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCreatorVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#EFBF04',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#000', fontSize: 16, lineHeight: 18 }}>+</Text>
            <Text style={{ color: '#000', fontFamily: 'Quilon-Medium', fontSize: 13 }}>Créer</Text>
          </TouchableOpacity>
        </View>
      </>
    );

    return (
      <View className="flex-1 bg-background">
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6"
          ListHeaderComponent={ExercisesHeader}
          ListEmptyComponent={
            error ? (
              <Text className="text-red-400 text-body-sm font-body text-center mt-8">{error}</Text>
            ) : (
              <Text className="text-white/40 text-body-sm font-body text-center mt-8">No exercises available</Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ color: '#ffffff', fontFamily: 'Quilon-Medium', fontSize: 15 }}>
                    {item.name}
                  </Text>
                  {item.isCustom ? (
                    <View style={{ backgroundColor: '#EFBF04', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#000', fontFamily: 'Rowan-Regular', fontSize: 11 }}>Perso</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {item.muscleGroups.map((group) => (
                    <View key={group} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Rowan-Regular', fontSize: 11 }}>{group}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {item.isCustom ? (
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => void handleDeleteExercise(item.id, item.name)}
                  style={{ marginLeft: 12, padding: 4 }}
                >
                  <Text style={{ fontSize: 16, color: 'rgba(239,68,68,0.8)' }}>🗑</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, marginLeft: 8 }}>{'›'}</Text>
              )}
            </TouchableOpacity>
          )}
        />
        <ExerciseCreatorModal
          visible={creatorVisible}
          onClose={() => setCreatorVisible(false)}
          onCreated={() => {
            setCreatorVisible(false);
            void loadData();
          }}
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
            const date = formatDate(item.startedAt);

            const totalVolumeKg = item.exercises.reduce((acc, ex) => {
              return acc + ex.sets.reduce((setAcc, s) => {
                if (s.completed && s.weight != null) {
                  return setAcc + s.weight * s.reps;
                }
                return setAcc;
              }, 0);
            }, 0);
            const volumeLabel = totalVolumeKg >= 1000
              ? `${(totalVolumeKg / 1000).toFixed(1)}t`
              : totalVolumeKg > 0
                ? `${Math.round(totalVolumeKg)}kg`
                : null;

            const exerciseNames = item.exercises.map((ex) => ex.exerciseName);
            const visibleNames = exerciseNames.slice(0, 3);
            const extraCount = exerciseNames.length - visibleNames.length;
            const exerciseSummary = extraCount > 0
              ? `${visibleNames.join(', ')} +${extraCount} autres`
              : visibleNames.join(', ');

            return (
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: '#ffffff', fontFamily: 'Quilon-Medium', fontSize: 15, marginBottom: 4 }}
                  >
                    {item.programName}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: exerciseSummary ? 6 : 0 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
                      {date}
                    </Text>
                    {item.durationMinutes != null ? (
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
                        · {item.durationMinutes} min
                      </Text>
                    ) : null}
                    {volumeLabel ? (
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
                        · {volumeLabel}
                      </Text>
                    ) : null}
                  </View>
                  {exerciseSummary ? (
                    <Text
                      style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Rowan-Regular', fontSize: 11 }}
                      numberOfLines={1}
                    >
                      {exerciseSummary}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, marginLeft: 8 }}>{'›'}</Text>
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
  const confirm = useConfirm();
  const toast = useToast();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowed, setIsFollowed] = useState(false);
  const [unfollowing, setUnfollowing] = useState(false);

  useEffect(() => {
    Promise.all([getProgramDetail(programId), getFollowedPrograms()])
      .then(([p, followed]) => {
        setProgram(p);
        setIsFollowed(followed.some((fp) => fp.program._id === programId));
      })
      .catch(() => setError('Unable to load program'))
      .finally(() => setLoading(false));
  }, [programId]);

  async function handleUnfollow() {
    const ok = await confirm({
      title: 'Ne plus suivre ce programme ?',
      message: 'Tu pourras le retrouver et le suivre à nouveau plus tard.',
      confirmText: 'Ne plus suivre',
      destructive: true,
    });
    if (!ok) return;
    setUnfollowing(true);
    try {
      await unfollowProgram(programId);
      toast.success('Programme retiré de ta liste');
      setIsFollowed(false);
    } catch {
      toast.error('Erreur lors de la suppression du suivi');
    } finally {
      setUnfollowing(false);
    }
  }

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

      {isFollowed ? (
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(239,68,68,0.12)',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 12,
            opacity: unfollowing ? 0.6 : 1,
          }}
          activeOpacity={0.8}
          onPress={() => void handleUnfollow()}
          disabled={unfollowing}
        >
          {unfollowing ? (
            <ActivityIndicator color="#ef4444" size="small" />
          ) : (
            <Text style={{ color: '#ef4444', fontFamily: 'Quilon-Medium', fontSize: 16 }}>
              Ne plus suivre
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
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
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}
