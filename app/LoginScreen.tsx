import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './AuthNavigator';
import { login } from '../services/authService';
import { useGoogleAuth, exchangeGoogleToken } from '../services/googleAuth';
import { signInWithApple } from '../services/appleAuth';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../hooks/AuthContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { onAuthSuccess } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { request, response: googleResponse, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        setGoogleLoading(true);
        exchangeGoogleToken(idToken)
          .then((res) => onAuthSuccess(res.token))
          .catch(() => setError('Échec de la connexion Google. Veuillez réessayer.'))
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [googleResponse, onAuthSuccess]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await login({ email: email.trim(), password });
      onAuthSuccess(res.token);
    } catch {
      setError('Identifiants invalides. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setAppleLoading(true);
    setError(null);
    try {
      await signInWithApple();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'ERR_CANCELED') {
        return;
      }
      const isAxiosError =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 404;
      if (isAxiosError) {
        setError('Apple Sign-In bientôt disponible');
      } else {
        setError('Échec de la connexion Apple. Veuillez réessayer.');
      }
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-accent text-h1 font-heading mb-2">Ironeo</Text>
        <Text className="text-white/60 text-body font-body mb-10">Entraîne-toi mieux. Vis mieux.</Text>

        {error !== null && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-400 text-body-sm font-body">{error}</Text>
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
          placeholder="Mot de passe"
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
            <ActivityIndicator color="#EFBF04" />
          ) : (
            <Text className="text-background text-body font-heading">Connexion</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/[0.06] rounded-xl py-4 items-center mb-3"
          onPress={() => promptAsync()}
          disabled={!request || loading || googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color="#EFBF04" />
          ) : (
            <Text className="text-white text-body font-heading">Continuer avec Google</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={12}
            style={{ width: '100%', height: 52, marginBottom: 24 }}
            onPress={() => { if (!appleLoading) { void handleAppleSignIn(); } }}
          />
        )}

        {Platform.OS !== 'ios' && <View className="mb-6" />}

        <Text className="text-white/30 text-caption font-body text-center mb-4">
          En continuant, vous acceptez nos{' '}
          <Text
            style={{ color: '#EFBF04' }}
            onPress={() => Linking.openURL('https://ironeo.com/cgu')}
          >
            Conditions d'utilisation
          </Text>
        </Text>

        <TouchableOpacity
          className="items-center py-2 mb-2"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-white/50 text-body-sm font-body">
            Pas encore de compte ?{' '}
            <Text className="text-accent font-heading">S'inscrire</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-2"
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text className="text-white/40 text-body-sm font-body">Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
