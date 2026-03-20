import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './hooks/AuthContext';
import { ToastProvider } from './context/ToastContext';
import RootNavigator from './app/RootNavigator';
import { initNotifications, requestNotificationPermissions } from './services/timerNotificationService';
import { configurePushNotifications, registerForPushNotifications } from './services/pushNotificationService';

SplashScreen.preventAutoHideAsync();
configurePushNotifications();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Quilon-Medium': require('./assets/fonts/Quilon-Medium.otf'),
    'Rowan-Regular': require('./assets/fonts/Rowan-Regular.otf'),
  });

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    initNotifications().catch(() => undefined);
    requestNotificationPermissions().catch(() => undefined);
    registerForPushNotifications().catch(() => undefined);

    notificationListener.current = Notifications.addNotificationReceivedListener(() => undefined);
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => undefined);

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
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </ToastProvider>
    </AuthProvider>
  );
}
