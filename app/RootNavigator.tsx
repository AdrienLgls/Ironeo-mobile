import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthContext } from '../hooks/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

export default function RootNavigator() {
  const { authState } = useAuthContext();

  if (authState.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {authState.status === 'authenticated' ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
