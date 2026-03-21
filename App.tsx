import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from './constants/config';

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN && !__DEV__,
  tracesSampleRate: 0.2,
});

import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Modal, View, Text, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
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

const BIOMETRIC_KEY = 'biometric_lock_enabled';

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

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [isLocked, setIsLocked] = useState(false);

  async function authenticate(): Promise<void> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Déverrouillez Ironeo',
        cancelLabel: 'Annuler',
        fallbackLabel: 'Utiliser le code',
      });
      if (result.success) setIsLocked(false);
    } catch {
      // Keep locked
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/background|inactive/) && nextState === 'active') {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_KEY);
        if (enabled === 'true') {
          setIsLocked(true);
          await authenticate();
        }
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

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
            <Modal visible={isLocked} transparent animationType="fade">
              <View style={{ flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Quilon-Medium', marginBottom: 24 }}>
                  Ironeo verrouillé
                </Text>
                <TouchableOpacity onPress={authenticate}>
                  <Text style={{ color: '#EFBF04', fontSize: 16, fontFamily: 'Rowan-Regular' }}>
                    Déverrouiller
                  </Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
