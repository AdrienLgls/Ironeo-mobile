import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { CommonActions } from '@react-navigation/native';
import { AuthProvider } from './hooks/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import RootNavigator, { navigationRef } from './app/RootNavigator';
import { initNotifications, requestNotificationPermissions } from './services/timerNotificationService';
import { configurePushNotifications, registerForPushNotifications } from './services/pushNotificationService';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkBanner from './components/NetworkBanner';

SplashScreen.preventAutoHideAsync();
configurePushNotifications();

type NotificationData =
  | { type: 'group_message'; groupId: string }
  | { type: 'friend_request' }
  | { type: 'notification' }
  | { type: string };

function handleNotificationTap(data: NotificationData): void {
  if (data.type === 'group_message' && 'groupId' in data) {
    navigationRef.current?.dispatch(CommonActions.navigate({ name: 'Profile' }));
    navigationRef.current?.dispatch(
      CommonActions.navigate({ name: 'GroupDetail', params: { groupId: data.groupId } }),
    );
  } else if (data.type === 'friend_request') {
    navigationRef.current?.dispatch(CommonActions.navigate({ name: 'Profile' }));
  } else {
    navigationRef.current?.dispatch(CommonActions.navigate({ name: 'Profile' }));
    navigationRef.current?.dispatch(CommonActions.navigate({ name: 'Notifications' }));
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Quilon-Medium': require('./assets/fonts/Quilon-Medium.otf'),
    'Rowan-Regular': require('./assets/fonts/Rowan-Regular.otf'),
  });

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (_e: unknown) {
        // Silent fail — user continues with cached version
      }
    }
    checkForUpdates();
  }, []);

  useEffect(() => {
    initNotifications().catch(() => undefined);
    requestNotificationPermissions().catch(() => undefined);
    registerForPushNotifications().catch(() => undefined);

    notificationListener.current = Notifications.addNotificationReceivedListener(() => undefined);
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      handleNotificationTap(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <NetworkBanner />
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
