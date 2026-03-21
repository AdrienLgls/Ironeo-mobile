import { useState, useEffect, useCallback } from 'react';
import { getStoredToken, logout as authLogout } from '../services/authService';
import api from '../services/api';
import type { UserProfile } from '../types/user';

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; token: string }
  | { status: 'unauthenticated' };

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const checkToken = useCallback(async () => {
    const token = await getStoredToken();
    if (token) {
      setAuthState({ status: 'authenticated', token });
    } else {
      setAuthState({ status: 'unauthenticated' });
    }
  }, []);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get<UserProfile>('/users/me');
      setProfile(data);
    } catch (e) {
      if (__DEV__) console.warn('refreshProfile failed:', e);
      // Pas de throw — l'app continue avec le profil stale
    }
  }, []);

  useEffect(() => {
    if (authState.status === 'authenticated') {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [authState.status, refreshProfile]);

  const logout = useCallback(async () => {
    await authLogout();
    setProfile(null);
    setAuthState({ status: 'unauthenticated' });
  }, []);

  const onAuthSuccess = useCallback((token: string) => {
    setAuthState({ status: 'authenticated', token });
  }, []);

  return { authState, profile, logout, onAuthSuccess, refresh: checkToken, refreshProfile };
}
