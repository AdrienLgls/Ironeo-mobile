import * as AppleAuthentication from 'expo-apple-authentication';
import api, { TOKEN_KEY, REFRESH_TOKEN_KEY } from './api';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse } from '../types/auth';

export async function signInWithApple(): Promise<AuthResponse> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { data } = await api.post<AuthResponse>('/auth/apple', {
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    fullName: credential.fullName,
    email: credential.email,
  });
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  if (data.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return data;
}
