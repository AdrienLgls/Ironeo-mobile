import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api, { TOKEN_KEY, REFRESH_TOKEN_KEY } from './api';
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '../types/auth';
import { useToast } from '../context/ToastContext';

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra ?? {};

export function useGoogleAuth() {
  const toast = useToast();
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: (extra.googleAndroidClientId as string) || undefined,
    iosClientId: (extra.googleIosClientId as string) || undefined,
    webClientId: (extra.googleWebClientId as string) || undefined,
  });

  const clientId = Platform.OS === 'ios'
    ? (extra.googleIosClientId as string | undefined)
    : (extra.googleAndroidClientId as string | undefined);

  const safePromptAsync: typeof promptAsync = async (...args) => {
    if (!clientId) {
      toast.error('Google Sign-In non configuré');
      return { type: 'dismiss' } as Awaited<ReturnType<typeof promptAsync>>;
    }
    return promptAsync(...args);
  };

  return { request, response, promptAsync: safePromptAsync };
}

export async function exchangeGoogleToken(idToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', { idToken });
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  if (data.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return data;
}
