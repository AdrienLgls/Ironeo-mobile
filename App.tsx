import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './hooks/AuthContext';
import RootNavigator from './app/RootNavigator';
import { initNotifications, requestNotificationPermissions } from './services/timerNotificationService';

export default function App() {
  useEffect(() => {
    initNotifications().catch(() => undefined);
    requestNotificationPermissions().catch(() => undefined);
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
