import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import api from '../services/api';
import type { UserProfile } from '../types/user';

interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  checkoutUrl: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '€0/month',
    features: ['3 programs', 'Basic exercises', 'Session tracking'],
    checkoutUrl: '',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '€6.99/month',
    features: ['Unlimited programs', 'All exercises', 'Advanced stats', 'Articles & quizzes'],
    checkoutUrl: 'https://ironeo.lemonsqueezy.com/checkout/premium',
  },
  {
    id: 'premium_plus',
    name: 'Premium+',
    price: '€12.99/month',
    features: ['Everything in Premium', 'AI coaching', 'Priority support', 'Custom programs'],
    checkoutUrl: 'https://ironeo.lemonsqueezy.com/checkout/premium-plus',
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api
      .get<UserProfile>('/users/me')
      .then(({ data }) => setCurrentStatus(data.subscriptionStatus ?? 'free'))
      .catch(() => undefined);
  }, []);

  function handleWebViewClose() {
    setCheckoutUrl(null);
    setRefreshing(true);
    api
      .get<UserProfile>('/users/me')
      .then(({ data }) => setCurrentStatus(data.subscriptionStatus ?? 'free'))
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      <Text className="text-white text-2xl font-bold mb-2">Subscription</Text>
      <Text className="text-white/40 text-sm mb-6">Unlock your full potential</Text>

      {refreshing && <ActivityIndicator color="#EFBF04" className="mb-4" />}

      {PLANS.map((plan) => {
        const isCurrent = currentStatus === plan.id;
        return (
          <View
            key={plan.id}
            className={`rounded-2xl mb-3 border overflow-hidden ${isCurrent ? 'border-accent bg-accent/10' : 'border-white/[0.08] bg-white/[0.04]'}`}
          >
            {/* Card highlight gradient — top glow */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 48,
                backgroundColor: isCurrent ? 'rgba(239,191,4,0.10)' : 'rgba(239,191,4,0.06)',
                opacity: 0.8,
              }}
              pointerEvents="none"
            />
            <View className="p-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white text-base font-bold">{plan.name}</Text>
              {isCurrent && (
                <View className="bg-accent rounded-full px-2 py-0.5">
                  <Text className="text-black text-xs font-semibold">Current</Text>
                </View>
              )}
            </View>
            <Text className="text-accent text-sm font-semibold mb-3">{plan.price}</Text>

            {plan.features.map((f) => (
              <Text key={f} className="text-white/60 text-xs mb-1">
                · {f}
              </Text>
            ))}

            {plan.checkoutUrl !== '' && !isCurrent && (
              <TouchableOpacity
                className="bg-accent rounded-xl py-3 items-center mt-3"
                activeOpacity={0.8}
                onPress={() => setCheckoutUrl(plan.checkoutUrl)}
              >
                <Text className="text-black font-bold text-sm">Upgrade to {plan.name}</Text>
              </TouchableOpacity>
            )}
            </View>
          </View>
        );
      })}

      <Modal visible={checkoutUrl !== null} animationType="slide" onRequestClose={handleWebViewClose}>
        <View className="flex-1 bg-background">
          <View className="flex-row items-center px-4 pb-3 border-b border-white/[0.06]" style={{ paddingTop: insets.top + 16 }}>
            <TouchableOpacity onPress={handleWebViewClose} activeOpacity={0.7} className="mr-4">
              <Text className="text-accent text-sm">✕ Close</Text>
            </TouchableOpacity>
            <Text className="text-white text-sm font-semibold">Checkout</Text>
          </View>
          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              style={{ flex: 1, backgroundColor: '#121212' }}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}
