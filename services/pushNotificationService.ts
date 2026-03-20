import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken } from './notificationService';

export function configurePushNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await registerPushToken(token, Platform.OS);
    return token;
  } catch {
    return null;
  }
}

export async function scheduleWorkoutReminder(hour: number, minute: number): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "C'est l'heure de s'entraîner 💪",
      body: "Ta séance t'attend. Lance Ironeo !",
    },
    trigger,
  });
}

export async function cancelWorkoutReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
