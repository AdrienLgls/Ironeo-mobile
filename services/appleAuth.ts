import * as AppleAuthentication from 'expo-apple-authentication';
import api, { TOKEN_KEY, REFRESH_TOKEN_KEY } from './api';
import * as SecureStore from 'expo-secure-store';

export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  try {
    const response = await api.post('/auth/apple', {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      fullName: credential.fullName,
      email: credential.email,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, response.data.token);
    if (response.data.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refreshToken);
    }
  } catch (error: unknown) {
    // Backend may not have Apple auth yet
    throw error;
  }
}
