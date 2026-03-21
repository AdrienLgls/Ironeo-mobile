import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './AuthNavigator';
import { useNavigation } from '@react-navigation/native';
import { forgotPassword } from '../services/authService';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 24 }}>
        <Text className="text-accent text-h1 font-heading mb-2">Ironeo</Text>
        <Text className="text-white/60 text-body font-body mb-10">
          Mot de passe oublié ?
        </Text>

        {error !== null && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-400 text-body-sm font-body">{error}</Text>
          </View>
        )}

        {success ? (
          <View className="bg-white/[0.06] rounded-xl px-4 py-5 mb-6">
            <Text className="text-white text-body font-body text-center">
              Vérifiez votre boîte mail — un lien de réinitialisation vous a été envoyé.
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              className="bg-white/[0.06] text-white rounded-xl px-4 py-4 mb-6 text-base"
              placeholder="Email"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              className="bg-accent rounded-xl py-4 items-center mb-4"
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#EFBF04" />
              ) : (
                <Text className="text-background text-body font-heading">
                  Envoyer le lien de réinitialisation
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          className="items-center py-2"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white/50 text-body-sm font-body">
            ← Retour à la connexion
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
