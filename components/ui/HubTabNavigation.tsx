import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

export interface HubTab {
  id: string;
  label: string;
}

interface Props {
  tabs: HubTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function HubTabNavigation({ tabs, activeTab, onTabChange }: Props) {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const translateOffset = useRef(new Animated.Value(8)).current;
  const containerWidth = useRef(0);
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  useEffect(() => {
    if (containerWidth.current <= 0) return;
    const tabWidth = containerWidth.current / tabs.length;
    Animated.spring(indicatorAnim, {
      toValue: activeIndex * tabWidth,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabs.length, indicatorAnim]);

  const tabWidth = containerWidth.current > 0 ? containerWidth.current / tabs.length : 0;
  const indicatorBarWidth = tabWidth > 16 ? tabWidth - 16 : tabWidth;

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w !== containerWidth.current) {
          containerWidth.current = w;
          const tw = w / tabs.length;
          indicatorAnim.setValue(activeIndex * tw);
        }
      }}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        padding: 4,
        flexDirection: 'row',
        position: 'relative',
        marginBottom: 20,
      }}
    >
      {/* Active background pill */}
      {containerWidth.current > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            width: tabWidth,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 7,
            transform: [{ translateX: indicatorAnim }],
          }}
        />
      )}

      {/* Gold underline indicator */}
      {containerWidth.current > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 6,
            height: 2,
            width: indicatorBarWidth,
            backgroundColor: '#EFBF04',
            borderRadius: 1,
            transform: [{ translateX: Animated.add(indicatorAnim, translateOffset) }],
          }}
        />
      )}

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
            style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{
              color: isActive ? '#fafafa' : 'rgba(255,255,255,0.45)',
              fontFamily: 'Quilon-Medium',
              fontSize: 12,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
