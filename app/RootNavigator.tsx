import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuthContext } from '../hooks/AuthContext';
import { sentryNavigationIntegration } from '../App';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

export type RootParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Home: undefined;
  Workout: undefined;
  Learn: undefined;
  Profile: undefined;
};

export const navigationRef = createNavigationContainerRef<RootParamList>();

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
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        sentryNavigationIntegration.registerNavigationContainer(navigationRef);
      }}
    >
      {authState.status === 'authenticated' ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
