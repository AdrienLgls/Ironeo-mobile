import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CHANNEL_ID = 'workout-timer';
const TASK_NAME = 'WORKOUT_TIMER_TASK';
const STORAGE_KEY_END_TIME = 'workout_timer_end_time';
const STORAGE_KEY_EXERCISE = 'workout_timer_exercise';

let activeNotificationId: string | null = null;

// Background task — reads end time from storage and updates notification
TaskManager.defineTask(TASK_NAME, async () => {
  const endTimeStr = await AsyncStorage.getItem(STORAGE_KEY_END_TIME);
  const exercise = (await AsyncStorage.getItem(STORAGE_KEY_EXERCISE)) ?? 'Workout';
  if (!endTimeStr) return;

  const remaining = Math.max(0, Math.floor((Number(endTimeStr) - Date.now()) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  await Notifications.scheduleNotificationAsync({
    identifier: 'workout-timer-bg',
    content: {
      title: exercise,
      body: `Rest: ${label}`,
      autoDismiss: false,
      sticky: false,
      data: { timerActive: true },
      ...(Platform.OS === 'android' && {
        android: { channelId: CHANNEL_ID, priority: Notifications.AndroidNotificationPriority.MAX },
      }),
    },
    trigger: null,
  });
});

export async function initNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Workout Timer',
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: false,
      sound: null,
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function startTimerNotification(
  durationSeconds: number,
  exerciseName: string
): Promise<void> {
  const endTime = Date.now() + durationSeconds * 1000;
  await AsyncStorage.setItem(STORAGE_KEY_END_TIME, String(endTime));
  await AsyncStorage.setItem(STORAGE_KEY_EXERCISE, exerciseName);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: exerciseName,
      body: `Rest: ${formatDuration(durationSeconds)}`,
      autoDismiss: false,
      data: { timerActive: true },
      ...(Platform.OS === 'android' && {
        android: { channelId: CHANNEL_ID, priority: Notifications.AndroidNotificationPriority.MAX },
      }),
    },
    trigger: null,
  });
  activeNotificationId = id;
}

export async function updateTimerNotification(
  remainingSeconds: number,
  exerciseName: string
): Promise<void> {
  if (activeNotificationId) {
    await Notifications.dismissNotificationAsync(activeNotificationId);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: exerciseName,
      body: `Rest: ${formatDuration(remainingSeconds)}`,
      autoDismiss: false,
      data: { timerActive: true },
      ...(Platform.OS === 'android' && {
        android: { channelId: CHANNEL_ID, priority: Notifications.AndroidNotificationPriority.MAX },
      }),
    },
    trigger: null,
  });
  activeNotificationId = id;
}

export async function stopTimerNotification(): Promise<void> {
  if (activeNotificationId) {
    await Notifications.dismissNotificationAsync(activeNotificationId);
    activeNotificationId = null;
  }
  await AsyncStorage.removeItem(STORAGE_KEY_END_TIME);
  await AsyncStorage.removeItem(STORAGE_KEY_EXERCISE);

  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (isRegistered) {
    await TaskManager.unregisterTaskAsync(TASK_NAME);
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
