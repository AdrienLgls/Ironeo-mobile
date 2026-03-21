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
  Linking,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { CommonActions, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '../services/api';
import { getUserStats, updateProfile, uploadAvatar, deleteAccount } from '../services/userService';
import { getPortalUrl } from '../services/paymentService';
import {
  getNotifications,
  markAllAsRead,
  getUnreadCount,
  type Notification,
} from '../services/notificationService';
import {
  exportSessionsCSV,
  exportSessionsJSON,
  exportPRsCSV,
} from '../services/exportService';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import type { UserStats } from '../types/user';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '../hooks/AuthContext';
import type { UserProfile, NotificationSettings } from '../types/user';
import PaywallScreen from './PaywallScreen';
import { formatDate } from '../utils/formatters';
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

type ExportKey = 'sessionsCSV' | 'sessionsJSON' | 'prsCSV';

function ProfileHomeScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<ExportKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const rootNavigation = useNavigation();

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

  async function handleExport(key: ExportKey): Promise<void> {
    setExportLoading(key);
    try {
      if (key === 'sessionsCSV') await exportSessionsCSV();
      else if (key === 'sessionsJSON') await exportSessionsJSON();
      else await exportPRsCSV();
      toast.success('Export prêt');
    } catch {
      toast.error('Échec de l\'export');
    } finally {
      setExportLoading(null);
    }
  }

  async function handlePortal(): Promise<void> {
    setPortalLoading(true);
    try {
      const url = await getPortalUrl();
      await Linking.openURL(url);
    } catch {
      toast.error('Impossible d\'ouvrir le portail d\'abonnement');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    const ok = await confirm({
      title: 'Supprimer mon compte',
      message: 'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      confirmText: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    setDeleteLoading(true);
    try {
      await deleteAccount();
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await AsyncStorage.clear();
      rootNavigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
      );
    } catch {
      toast.error('Impossible de supprimer le compte');
    } finally {
      setDeleteLoading(false);
    }
  }

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

      {(profile?.subscriptionStatus === 'premium' || profile?.subscriptionStatus === 'premium_plus') && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePortal}
          disabled={portalLoading}
          className="flex-row items-center gap-3 bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
        >
          <Ionicons name="card-outline" size={18} color="#EFBF04" />
          <Text className="text-white text-body-sm font-body flex-1">Gérer mon abonnement</Text>
          {portalLoading ? (
            <ActivityIndicator color="#EFBF04" size="small" />
          ) : (
            <Text className="text-white/30 text-body-sm font-body">›</Text>
          )}
        </TouchableOpacity>
      )}

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

      {/* Mes données */}
      <Text className="text-white/40 text-overline font-body uppercase tracking-wider mt-6 mb-2">
        Mes données
      </Text>

      {(
        [
          { key: 'sessionsCSV', label: 'Sessions CSV' },
          { key: 'sessionsJSON', label: 'Sessions JSON' },
          { key: 'prsCSV', label: 'Records CSV' },
        ] as { key: ExportKey; label: string }[]
      ).map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          activeOpacity={0.7}
          onPress={() => handleExport(key)}
          disabled={exportLoading !== null}
          className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
        >
          <Text className="text-white text-body-sm font-body">{label}</Text>
          {exportLoading === key ? (
            <ActivityIndicator color="#EFBF04" size="small" />
          ) : (
            <Text style={{ color: '#EFBF04', fontSize: 14 }}>↓</Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Légal */}
      <Text className="text-white/40 text-overline font-body uppercase tracking-wider mt-6 mb-2">
        Légal
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => Linking.openURL('https://ironeo.com/cgu')}
        className="flex-row items-center gap-3 bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body flex-1">Conditions d'utilisation</Text>
        <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => Linking.openURL('https://ironeo.com/politique-confidentialite')}
        className="flex-row items-center gap-3 bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body flex-1">Politique de confidentialité</Text>
        <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>

      {/* Suppression de compte */}
      <Text className="text-white/40 text-overline font-body uppercase tracking-wider mt-6 mb-2">
        Zone dangereuse
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleDeleteAccount}
        disabled={deleteLoading}
        className="flex-row items-center justify-center bg-white/[0.04] rounded-2xl px-4 py-4"
      >
        {deleteLoading ? (
          <ActivityIndicator color="#ef4444" size="small" />
        ) : (
          <Text style={{ color: '#ef4444', fontSize: 14, fontFamily: 'Rowan-Regular' }}>
            Supprimer mon compte
          </Text>
        )}
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
  const [pseudo, setPseudo] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [existingAvatar, setExistingAvatar] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<UserProfile>('/users/me')
      .then(({ data }) => {
        setName(data.name ?? '');
        setPseudo(data.pseudo ?? '');
        setBio(data.bio ?? '');
        setExistingAvatar(data.avatar);
      })
      .catch(() => undefined);
  }, []);

  async function handlePickAvatar(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      await updateProfile({ pseudo: pseudo || undefined, bio: bio || undefined });
      if (avatarUri) {
        await uploadAvatar(avatarUri);
      }
      toast.success('Profil mis à jour');
      navigation.goBack();
    } catch {
      toast.error('Impossible de sauvegarder le profil');
    } finally {
      setSaving(false);
    }
  }

  const displayUri = avatarUri ?? existingAvatar;
  const initials = name.charAt(0).toUpperCase() || '?';

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Retour</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-6">Modifier le profil</Text>

      {/* Avatar picker */}
      <View className="items-center mb-8">
        <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={{ position: 'relative' }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(239,191,4,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {displayUri ? (
              <Image
                source={{ uri: displayUri }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <Text style={{ color: '#EFBF04', fontSize: 28, fontFamily: 'Quilon-Medium' }}>{initials}</Text>
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: '#EFBF04',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="camera" size={14} color="#121212" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Pseudo */}
      <View className="mb-4">
        <Text className="text-white/50 text-overline font-body mb-1 uppercase tracking-wider">Pseudo</Text>
        <TextInput
          value={pseudo}
          onChangeText={setPseudo}
          placeholder="Ton pseudo"
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCapitalize="none"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 14, fontFamily: 'Rowan-Regular' }}
        />
      </View>

      {/* Bio */}
      <View className="mb-6">
        <Text className="text-white/50 text-overline font-body mb-1 uppercase tracking-wider">Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Parle de toi..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline
          numberOfLines={4}
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 14, fontFamily: 'Rowan-Regular', height: 100, textAlignVertical: 'top' }}
        />
      </View>

      <TouchableOpacity
        style={{ backgroundColor: '#EFBF04', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
        activeOpacity={0.8}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#121212" size="small" />
        ) : (
          <Text style={{ color: '#121212', fontSize: 16, fontFamily: 'Quilon-Medium' }}>Enregistrer</Text>
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
        <Text className="text-accent text-body-sm font-body">← Retour</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-6">Notifications</Text>

      {loading ? (
        <ActivityIndicator color="#EFBF04" className="mt-8" />
      ) : (
        <>
          <View className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2">
            <Text className="text-white text-body-sm font-body">Rappels d'entraînement</Text>
            <Switch
              value={settings.workoutReminders}
              onValueChange={() => toggle('workoutReminders')}
              disabled={saving}
              trackColor={{ true: '#EFBF04', false: 'rgba(255,255,255,0.1)' }}
              thumbColor="#fff"
            />
          </View>

          <View className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4">
            <Text className="text-white text-body-sm font-body">Rappels jours de repos</Text>
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

const BIOMETRIC_KEY = 'biometric_lock_enabled';

function SettingsScreen({
  navigation,
}: NativeStackScreenProps<ProfileStackParamList, 'Settings'>) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthContext();
  const toast = useToast();
  const confirm = useConfirm();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(BIOMETRIC_KEY)
      .then((val) => setBiometricEnabled(val === 'true'))
      .catch(() => undefined);
  }, []);

  async function handleBiometricToggle(value: boolean): Promise<void> {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        toast.error('Biométrie non disponible sur cet appareil');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmer pour activer le verrouillage',
        cancelLabel: 'Annuler',
        fallbackLabel: 'Utiliser le code',
      });
      if (!result.success) return;
      await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
      setBiometricEnabled(true);
    } else {
      await SecureStore.setItemAsync(BIOMETRIC_KEY, 'false');
      setBiometricEnabled(false);
    }
  }

  async function handleLogout() {
    const ok = await confirm({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText: 'Déconnexion',
      destructive: true,
    });
    if (ok) logout();
  }

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: 'Supprimer le compte',
      message: 'Cette action supprimera définitivement votre compte et toutes vos données. Cette action est irréversible.',
      confirmText: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete('/users/me');
      await logout();
    } catch {
      toast.error('Impossible de supprimer le compte');
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Retour</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-6">Paramètres</Text>

      <View className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-2">
        <Text className="text-white text-body-sm font-body">Verrouillage Face ID / Touch ID</Text>
        <Switch
          value={biometricEnabled}
          onValueChange={handleBiometricToggle}
          trackColor={{ true: '#EFBF04', false: 'rgba(255,255,255,0.1)' }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleLogout}
        className="bg-white/[0.04] rounded-2xl px-4 py-4 mb-2"
      >
        <Text className="text-white text-body-sm font-body">Déconnexion</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleDeleteAccount}
        className="bg-white/[0.04] rounded-2xl px-4 py-4"
      >
        <Text className="text-red-400 text-body-sm font-body">Supprimer le compte</Text>
      </TouchableOpacity>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'Rowan-Regular' }}>
          Ironeo v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
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
                {formatDate(item.createdAt)}
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
