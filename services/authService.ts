import * as SecureStore from 'expo-secure-store';
import api, { TOKEN_KEY, REFRESH_TOKEN_KEY } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  if (data.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  if (data.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return data;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post(`/auth/reset-password/${token}`, { newPassword });
}
