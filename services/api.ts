import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../app/RootNavigator';
import type { RefreshResponse } from '../types/auth';

export const TOKEN_KEY = 'ironeo_jwt';
export const REFRESH_TOKEN_KEY = 'ironeo_refresh_jwt';

const api = axios.create({
  baseURL: 'https://ironeo.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

async function clearSessionAndRedirect(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (originalRequest._retry) {
      await clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token stored');
      }

      const { data } = await axios.post<RefreshResponse>(
        'https://ironeo.com/api/auth/refresh',
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      if (data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      }

      processQueue(null, data.token);

      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return axios(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError, null);
      await clearSessionAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
