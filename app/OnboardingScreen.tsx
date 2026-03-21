import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './AuthNavigator';
import { FadeInUp } from '../components/ui/FadeIn';

type OnboardingNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  key: string;
  emoji: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    key: '1',
    emoji: '💪',
    title: 'Entraîne-toi avec méthode',
    description:
      'Programmes structurés, suivi de séances, détection automatique de vos records personnels.',
  },
  {
    key: '2',
    emoji: '📊',
    title: 'Suivez vos progrès',
    description:
      'Mensurations, photos de progression, Year in Review — votre évolution visible.',
  },
  {
    key: '3',
    emoji: '🏆',
    title: 'Rejoignez la communauté',
    description:
      "Amis, groupes d'entraînement, classements — restez motivés ensemble.",
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  async function handleFinish() {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
    } catch {
      // Storage failure is non-blocking — proceed to Login anyway
    }
    navigation.navigate('Login');
  }

  function handleNext() {
    const nextIndex = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  }

  function handleButtonPress() {
    if (activeIndex < SLIDES.length - 1) {
      handleNext();
    } else {
      handleFinish();
    }
  }

  function renderSlide({ item }: { item: Slide }) {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <FadeInUp duration={600} delay={100}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </FadeInUp>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleButtonPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {activeIndex < SLIDES.length - 1 ? 'Suivant' : 'Commencer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Quilon-Medium',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Rowan-Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#EFBF04',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  button: {
    backgroundColor: '#EFBF04',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 16,
    color: '#121212',
  },
});
