import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import api, { TOKEN_KEY } from './api';
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra ?? {};

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: (extra.googleAndroidClientId as string) || undefined,
    iosClientId: (extra.googleIosClientId as string) || undefined,
    webClientId: (extra.googleWebClientId as string) || undefined,
  });

  return { request, response, promptAsync };
}

export async function exchangeGoogleToken(idToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', { idToken });
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  return data;
}
