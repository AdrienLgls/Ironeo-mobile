import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getUserStats } from '../services/userService';
import {
  getNotifications,
  markAllAsRead,
  getUnreadCount,
  type Notification,
} from '../services/notificationService';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import type { UserStats } from '../types/user';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../hooks/AuthContext';
import type { UserProfile, NotificationSettings } from '../types/user';
import PaywallScreen from './PaywallScreen';
import WorkoutReminderSettings from './NotificationSettingsScreen';
import BodyMeasurementsScreenComponent from './BodyMeasurementsScreen';
import ProgressPhotosScreenComponent from './ProgressPhotosScreen';
import YearInReviewScreenComponent from './YearInReviewScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  WorkoutReminders: undefined;
  Settings: undefined;
  Paywall: undefined;
  Notifications: undefined;
  BodyMeasurements: undefined;
  ProgressPhotos: undefined;
  YearInReview: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

// --- Profile Home ---

function ProfileHomeScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<UserProfile>('/users/me').then(({ data }) => data),
      getUserStats().catch(() => null),
      getUnreadCount().catch(() => 0),
    ])
      .then(([profileData, statsData, count]) => {
        setProfile(profileData);
        setStats(statsData);
        setUnreadCount(count);
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
      {/* Header row with bell */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}
          style={{ padding: 8, position: 'relative' }}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#ef4444',
              }}
            />
          )}
        </TouchableOpacity>
      </View>

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
        onPress={() => navigation.navigate('WorkoutReminders')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Rappels d'entraînement</Text>
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
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Paramètres</Text>
        <Text className="text-white/30 text-body-sm font-body">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('BodyMeasurements')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Mensurations</Text>
        <Text className="text-white/30 text-body-sm font-body">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ProgressPhotos')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Photos de progression</Text>
        <Text className="text-white/30 text-body-sm font-body">›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('YearInReview')}
        className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4"
      >
        <Text className="text-white text-body-sm font-body">Mon année</Text>
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
  const toast = useToast();
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
      toast.error('Unable to save profile');
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
  const toast = useToast();
  const confirm = useConfirm();

  async function handleLogout() {
    const ok = await confirm({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      destructive: true,
    });
    if (ok) logout();
  }

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: 'Delete account',
      message: 'This will permanently delete your account and all data. This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete('/users/me');
      await logout();
    } catch {
      toast.error('Unable to delete account');
    }
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

// --- Notifications Screen ---

function NotificationsScreenInline({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'Notifications'>) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#121212', paddingTop: insets.top + 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#EFBF04', fontSize: 14, fontFamily: 'Rowan-Regular' }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Quilon-Medium' }}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Rowan-Regular' }}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#EFBF04" size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular' }}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: item.isRead ? 'rgba(255,255,255,0.04)' : 'rgba(239,191,4,0.08)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Rowan-Regular' }}>{item.message}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Rowan-Regular', marginTop: 4 }}>
                {new Date(item.createdAt).toLocaleDateString('fr-CA')}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// --- BodyMeasurements wrapper ---

function BodyMeasurementsWrapper({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'BodyMeasurements'>) {
  return <BodyMeasurementsScreenComponent onBack={() => navigation.goBack()} />;
}

// --- ProgressPhotos wrapper ---

function ProgressPhotosWrapper({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'ProgressPhotos'>) {
  return <ProgressPhotosScreenComponent navigation={navigation} />;
}

// --- YearInReview wrapper ---

function YearInReviewWrapper({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'YearInReview'>) {
  return (
    <YearInReviewScreenComponent
      navigation={navigation as unknown as import('@react-navigation/native-stack').NativeStackNavigationProp<{ YearInReview: undefined }, 'YearInReview'>}
      route={{ key: 'YearInReview', name: 'YearInReview', params: undefined }}
    />
  );
}

// --- Stack Navigator ---

function WorkoutRemindersScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'WorkoutReminders'>) {
  return <WorkoutReminderSettings onBack={() => navigation.goBack()} />;
}

export default function ProfileScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="WorkoutReminders" component={WorkoutRemindersScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreenInline} />
      <Stack.Screen name="BodyMeasurements" component={BodyMeasurementsWrapper} />
      <Stack.Screen name="ProgressPhotos" component={ProgressPhotosWrapper} />
      <Stack.Screen name="YearInReview" component={YearInReviewWrapper} />
    </Stack.Navigator>
  );
}
