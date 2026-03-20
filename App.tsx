import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './hooks/AuthContext';
import { ToastProvider } from './context/ToastContext';
import RootNavigator from './app/RootNavigator';
import { initNotifications, requestNotificationPermissions } from './services/timerNotificationService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Quilon-Medium': require('./assets/fonts/Quilon-Medium.otf'),
    'Rowan-Regular': require('./assets/fonts/Rowan-Regular.otf'),
  });

  useEffect(() => {
    initNotifications().catch(() => undefined);
    requestNotificationPermissions().catch(() => undefined);
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
