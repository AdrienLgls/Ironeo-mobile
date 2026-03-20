import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../services/api';
import { getUserStats } from '../services/userService';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import type { UserStats } from '../types/user';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../hooks/AuthContext';
import type { UserProfile, NotificationSettings } from '../types/user';
import PaywallScreen from './PaywallScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  Settings: undefined;
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

// --- Profile Home ---

function ProfileHomeScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<UserProfile>('/users/me').then(({ data }) => data),
      getUserStats().catch(() => null),
    ])
      .then(([profileData, statsData]) => {
        setProfile(profileData);
        setStats(statsData);
      })
      .catch(() => undefined)
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
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Profile hero */}
      <View className="bg-white/[0.04] rounded-2xl p-6 mb-6 items-center">
        {/* Avatar */}
        <View className="w-20 h-20 rounded-full bg-accent/20 items-center justify-center mb-3">
          <Text className="text-accent text-h3 font-heading">
            {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text className="text-white text-h4 font-heading">{profile?.name ?? '—'}</Text>
        <Text className="text-white/40 text-caption font-body mt-1">{profile?.email ?? '—'}</Text>
        {/* Level badge */}
        {stats?.level != null && (
          <View className="bg-accent/20 rounded-full px-4 py-1.5 mt-3">
            <Text className="text-accent text-caption font-body">Niveau {stats.level}</Text>
          </View>
        )}
      </View>

      {/* Stats grid */}
      {stats && (
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white/[0.04] rounded-2xl p-3 items-center">
            <Text className="text-accent text-h3 font-heading">{stats.totalWorkouts}</Text>
            <Text className="text-white/50 text-caption font-body mt-1 text-center">Séances</Text>
          </View>
          <View className="flex-1 bg-white/[0.04] rounded-2xl p-3 items-center">
            <Text className="text-accent text-h3 font-heading">{stats.streak}</Text>
            <Text className="text-white/50 text-caption font-body mt-1 text-center">Série 🔥</Text>
          </View>
          <View className="flex-1 bg-white/[0.04] rounded-2xl p-3 items-center">
            <Text className="text-accent text-h3 font-heading">{stats.totalPRs ?? 0}</Text>
            <Text className="text-white/50 text-caption font-body mt-1 text-center">PRs ⚡</Text>
          </View>
          <View className="flex-1 bg-white/[0.04] rounded-2xl p-3 items-center">
            <Text className="text-accent text-h3 font-heading">{stats.totalXP ?? stats.xp ?? 0}</Text>
            <Text className="text-white/50 text-caption font-body mt-1 text-center">XP</Text>
          </View>
        </View>
      )}

      {/* Activity heatmap */}
      <View className="bg-white/[0.02] rounded-2xl p-4 mb-6">
        <ActivityHeatmap maxWeeks={26} />
      </View>

      {/* Navigation items */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('EditProfile')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Modifier le profil</Text>
        <Text className="text-white/30 text-body-sm font-body">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('NotificationSettings')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Notifications</Text>
        <Text className="text-white/30 text-body-sm font-body">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Paywall')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Abonnement</Text>
        <Text className="text-white/30 text-body-sm font-body">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Settings')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4"
      >
        <Text className="text-white text-body-sm font-body">Paramètres</Text>
        <Text className="text-white/30 text-body-sm font-body">›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- Edit Profile ---

function EditProfileScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<UserProfile>('/users/me')
      .then(({ data }) => {
        setName(data.name ?? '');
        setWeight(data.weight != null ? String(data.weight) : '');
        setHeight(data.height != null ? String(data.height) : '');
        setGoal(data.goal ?? '');
      })
      .catch(() => undefined);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        name,
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
        goal: goal || undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-6">Edit profile</Text>

      {([
        { label: 'Name', value: name, setter: setName, placeholder: 'Your name' },
        { label: 'Weight (kg)', value: weight, setter: setWeight, placeholder: '75', keyboard: 'numeric' as const },
        { label: 'Height (cm)', value: height, setter: setHeight, placeholder: '175', keyboard: 'numeric' as const },
        { label: 'Goal', value: goal, setter: setGoal, placeholder: 'e.g. lose weight, build muscle' },
      ] as const).map(({ label, value, setter, placeholder }) => (
        <View key={label} className="mb-4">
          <Text className="text-white/50 text-overline font-body mb-1 uppercase tracking-wider">{label}</Text>
          <TextInput
            value={value}
            onChangeText={setter as (v: string) => void}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.2)"
            className="bg-white/[0.06] rounded-xl px-4 py-3 text-white text-sm"
          />
        </View>
      ))}

      <TouchableOpacity
        className="bg-accent rounded-2xl py-4 items-center mt-2"
        activeOpacity={0.8}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text className="text-black text-body font-heading">Save</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- Notification Settings ---

function NotificationSettingsScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'NotificationSettings'>) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotificationSettings>({
    workoutReminders: false,
    restDayReminders: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<NotificationSettings>('/users/notifications')
      .then(({ data }) => setSettings(data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key: keyof NotificationSettings) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaving(true);
    try {
      await api.patch('/users/notifications', updated);
    } catch {
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-6">Notifications</Text>

      {loading ? (
        <ActivityIndicator color="#EFBF04" className="mt-8" />
      ) : (
        <>
          <View className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2">
            <Text className="text-white text-body-sm font-body">Workout reminders</Text>
            <Switch
              value={settings.workoutReminders}
              onValueChange={() => toggle('workoutReminders')}
              disabled={saving}
              trackColor={{ true: '#EFBF04', false: 'rgba(255,255,255,0.1)' }}
              thumbColor="#fff"
            />
          </View>

          <View className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4">
            <Text className="text-white text-body-sm font-body">Rest day reminders</Text>
            <Switch
              value={settings.restDayReminders}
              onValueChange={() => toggle('restDayReminders')}
              disabled={saving}
              trackColor={{ true: '#EFBF04', false: 'rgba(255,255,255,0.1)' }}
              thumbColor="#fff"
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

// --- Settings ---

function SettingsScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'Settings'>) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthContext();

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me');
              await logout();
            } catch {
              Alert.alert('Error', 'Unable to delete account');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-6">Settings</Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleLogout}
        className="bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleDeleteAccount}
        className="bg-white/[0.04] rounded-2xl px-4 py-4"
      >
        <Text className="text-red-400 text-body-sm font-body">Delete account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- Stack Navigator ---

export default function ProfileScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
    </Stack.Navigator>
  );
}
