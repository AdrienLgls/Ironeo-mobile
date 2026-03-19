import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './hooks/AuthContext';
import RootNavigator from './app/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
