import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './AuthNavigator';
import { register } from '../services/authService';
import { useNavigation } from '@react-navigation/native';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-accent text-4xl font-bold mb-2">Ironeo</Text>
        <Text className="text-white/60 text-base mb-10">Create your account.</Text>

        {error !== null && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        <TextInput
          className="bg-white/[0.06] text-white rounded-xl px-4 py-4 mb-3 text-base"
          placeholder="Full name"
          placeholderTextColor="#666"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
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
          placeholder="Password (min. 8 characters)"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="bg-accent rounded-xl py-4 items-center mb-4"
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text className="text-background font-bold text-base">Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-2"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-white/50 text-sm">
            Already have an account?{' '}
            <Text className="text-accent font-semibold">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
