import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import WorkoutScreen from './WorkoutScreen';
import LearnScreen from './LearnScreen';
import SocialScreen from './SocialScreen';
import ProfileScreen from './ProfileScreen';
import { useSocialBadge } from '../hooks/useSocialBadge';

export type TabParamList = {
  Home: undefined;
  Workout: undefined;
  Learn: undefined;
  Social: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLOT_WIDTH = SCREEN_WIDTH / 6;
const INDICATOR_WIDTH = 40;
const TAB_HEIGHT = 60;

// Maps tab index (0-4) to 6-slot position: Home→0, Workout→1, (FAB→2), Learn→3, Social→4, Profile→5
const TAB_SLOT: Record<number, number> = { 0: 0, 1: 1, 2: 3, 3: 4, 4: 5 };

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Home: '🏠',
  Workout: '💪',
  Learn: '📚',
  Social: '👥',
  Profile: '👤',
};

interface CustomTabBarProps extends BottomTabBarProps {
  badgeCount: number;
  clearBadge: () => void;
}

function CustomTabBar({ state, descriptors, navigation, badgeCount, clearBadge }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const activeTabIndex = state.index;
  const targetSlot = TAB_SLOT[activeTabIndex] ?? 0;
  const targetLeft = targetSlot * SLOT_WIDTH + (SLOT_WIDTH - INDICATOR_WIDTH) / 2;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: targetLeft,
      damping: 20,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [activeTabIndex, targetLeft, indicatorAnim]);

  const handleFAB = () => {
    navigation.navigate('Workout');
  };

  return (
    <View
      style={{
        backgroundColor: 'rgba(18, 18, 18, 0.95)',
        height: TAB_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Animated gold indicator line at top */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            width: INDICATOR_WIDTH,
            height: 2,
            backgroundColor: '#EFBF04',
            borderRadius: 1,
            shadowColor: '#EFBF04',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 8,
            elevation: 4,
            transform: [{ translateX: indicatorAnim }],
          }}
        />
      </View>
      {/* Radial glow under active tab indicator — simulates ellipse gold gradient */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: (INDICATOR_WIDTH - 60) / 2,
          width: 60,
          height: 20,
          borderRadius: 10,
          backgroundColor: 'rgba(239,191,4,0.25)',
          transform: [
            { translateX: indicatorAnim },
            { scaleX: 2 },
          ],
        }}
      />

      {/* Tab bar content */}
      <View style={{ flexDirection: 'row', alignItems: 'center', height: TAB_HEIGHT }}>
        {/* Left tabs: Home, Workout */}
        {state.routes.slice(0, 2).map((route, index) => {
          const { options } = descriptors[route.key];
          const isActive = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 22, opacity: isActive ? 1 : 0.5 }}>
                {TAB_ICONS[route.name as keyof TabParamList]}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Center FAB */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={handleFAB}
            activeOpacity={0.8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#EFBF04',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#EFBF04',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 6,
            }}
            accessibilityLabel="Démarrer une séance"
          >
            <Text style={{ fontSize: 22, color: '#000', fontWeight: '700', lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Right tabs: Learn, Social, Profile */}
        {state.routes.slice(2).map((route, index) => {
          const actualIndex = index + 2;
          const { options } = descriptors[route.key];
          const isActive = state.index === actualIndex;
          const isSocial = route.name === 'Social';
          const showBadge = isSocial && badgeCount > 0;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={() => {
                if (isSocial) clearBadge();
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 22, opacity: isActive ? 1 : 0.5 }}>
                  {TAB_ICONS[route.name as keyof TabParamList]}
                </Text>
                {showBadge && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#ef4444',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700', lineHeight: 14 }}>
                      {badgeCount >= 10 ? '9+' : String(badgeCount)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabNavigator() {
  const { badgeCount, clearBadge } = useSocialBadge();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} badgeCount={badgeCount} clearBadge={clearBadge} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
