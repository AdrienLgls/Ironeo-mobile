import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import api, { TOKEN_KEY } from './api';
import type { AuthResponse } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthConfig {
  androidClientId: string;
  iosClientId: string;
  webClientId: string;
}

// These values are injected via app.json/environment — placeholders for now
const GOOGLE_CONFIG: GoogleAuthConfig = {
  androidClientId: '',
  iosClientId: '',
  webClientId: '',
};

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CONFIG.androidClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    webClientId: GOOGLE_CONFIG.webClientId,
  });

  return { request, response, promptAsync };
}

export async function exchangeGoogleToken(idToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', { idToken });
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  return data;
}
