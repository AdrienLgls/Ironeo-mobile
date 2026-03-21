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
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from './AuthNavigator';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resetPassword } from '../services/authService';

type ResetPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const insets = useSafeAreaInsets();

  const { token } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Both fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, newPassword);
      navigation.navigate('Login');
    } catch {
      setError('Le lien est invalide ou expiré. Veuillez recommencer.');
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
          Nouveau mot de passe
        </Text>

        {error !== null && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-400 text-body-sm font-body">{error}</Text>
          </View>
        )}

        <TextInput
          className="bg-white/[0.06] text-white rounded-xl px-4 py-4 mb-3 text-base"
          placeholder="Nouveau mot de passe"
          placeholderTextColor="#666"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          className="bg-white/[0.06] text-white rounded-xl px-4 py-4 mb-6 text-base"
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="#666"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          className="bg-accent rounded-xl py-4 items-center mb-4"
          onPress={handleReset}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text className="text-background text-body font-heading">Réinitialiser</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-2"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-white/50 text-body-sm font-body">
            ← Retour à la connexion
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
