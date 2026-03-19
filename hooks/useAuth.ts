import { useState, useEffect, useCallback } from 'react';
import { getStoredToken, logout as authLogout } from '../services/authService';

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; token: string }
  | { status: 'unauthenticated' };

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

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

  const logout = useCallback(async () => {
    await authLogout();
    setAuthState({ status: 'unauthenticated' });
  }, []);

  const onAuthSuccess = useCallback((token: string) => {
    setAuthState({ status: 'authenticated', token });
  }, []);

  return { authState, logout, onAuthSuccess, refresh: checkToken };
}
