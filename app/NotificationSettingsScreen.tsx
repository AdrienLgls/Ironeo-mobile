import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleWorkoutReminder, cancelWorkoutReminders } from '../services/pushNotificationService';

const STORAGE_KEY_ENABLED = 'reminder_enabled';
const STORAGE_KEY_HOUR = 'reminder_hour';
const STORAGE_KEY_MINUTE = 'reminder_minute';

interface Props {
  onBack: () => void;
}

export default function NotificationSettingsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState('8');
  const [minute, setMinute] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_ENABLED),
      AsyncStorage.getItem(STORAGE_KEY_HOUR),
      AsyncStorage.getItem(STORAGE_KEY_MINUTE),
    ])
      .then(([storedEnabled, storedHour, storedMinute]) => {
        setEnabled(storedEnabled === 'true');
        if (storedHour !== null) setHour(storedHour);
        if (storedMinute !== null) setMinute(storedMinute);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(value: boolean) {
    setEnabled(value);
    if (!value) {
      await cancelWorkoutReminders().catch(() => undefined);
      await AsyncStorage.setItem(STORAGE_KEY_ENABLED, 'false').catch(() => undefined);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY_ENABLED, 'true').catch(() => undefined);
    }
  }

  async function handleSave() {
    const h = Math.min(23, Math.max(0, parseInt(hour, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minute, 10) || 0));
    setHour(String(h));
    setMinute(String(m));
    setSaving(true);
    try {
      if (enabled) {
        await scheduleWorkoutReminder(h, m);
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEY_ENABLED, 'true'),
          AsyncStorage.setItem(STORAGE_KEY_HOUR, String(h)),
          AsyncStorage.setItem(STORAGE_KEY_MINUTE, String(m)),
        ]);
      } else {
        await cancelWorkoutReminders();
        await AsyncStorage.setItem(STORAGE_KEY_ENABLED, 'false');
      }
    } catch {
      // fail silently — reminder is best-effort
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 32,
      }}
    >
      <TouchableOpacity onPress={onBack} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-h2 font-heading mb-6">
        Rappels d'entraînement
      </Text>

      {loading ? (
        <ActivityIndicator color="#EFBF04" className="mt-8" />
      ) : (
        <>
          <View className="flex-row items-center justify-between bg-white/[0.04] rounded-2xl px-4 py-4 mb-4">
            <Text className="text-white text-body-sm font-body">Activer les rappels</Text>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ true: '#EFBF04', false: 'rgba(255,255,255,0.1)' }}
              thumbColor="#fff"
            />
          </View>

          {enabled && (
            <View className="bg-white/[0.04] rounded-2xl px-4 py-4 mb-6">
              <Text className="text-white/50 text-overline font-body mb-3 uppercase tracking-wider">
                Heure du rappel
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="text-white/40 text-caption font-body mb-1">Heure (0–23)</Text>
                  <TextInput
                    value={hour}
                    onChangeText={setHour}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-white/[0.06] rounded-xl px-4 py-3 text-white text-sm text-center"
                  />
                </View>
                <Text className="text-white/50 text-h3 font-heading mt-5">:</Text>
                <View className="flex-1">
                  <Text className="text-white/40 text-caption font-body mb-1">Minute (0–59)</Text>
                  <TextInput
                    value={minute}
                    onChangeText={setMinute}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-white/[0.06] rounded-xl px-4 py-3 text-white text-sm text-center"
                  />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            className="bg-accent rounded-2xl py-4 items-center"
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#EFBF04" size="small" />
            ) : (
              <Text className="text-black text-body font-heading">Enregistrer</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
