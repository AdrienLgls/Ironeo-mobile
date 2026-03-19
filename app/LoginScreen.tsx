import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './AuthNavigator';
import { login } from '../services/authService';
import { useGoogleAuth, exchangeGoogleToken } from '../services/googleAuth';
import { useNavigation } from '@react-navigation/native';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { request, response: googleResponse, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        setGoogleLoading(true);
        exchangeGoogleToken(idToken)
          .catch(() => setError('Google sign-in failed. Please try again.'))
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [googleResponse]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-accent text-4xl font-bold mb-2">Ironeo</Text>
        <Text className="text-white/60 text-base mb-10">Train smarter. Live better.</Text>

        {error !== null && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        <TextInput
          className="bg-white/[0.06] text-white rounded-xl px-4 py-4 mb-3 text-base"
          placeholder="Email"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="bg-white/[0.06] text-white rounded-xl px-4 py-4 mb-6 text-base"
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="bg-accent rounded-xl py-4 items-center mb-3"
          onPress={handleLogin}
          disabled={loading || googleLoading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text className="text-background font-bold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/[0.06] rounded-xl py-4 items-center mb-6"
          onPress={() => promptAsync()}
          disabled={!request || loading || googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color="#EFBF04" />
          ) : (
            <Text className="text-white font-semibold text-base">Continue with Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-2"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-white/50 text-sm">
            No account yet?{' '}
            <Text className="text-accent font-semibold">Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
