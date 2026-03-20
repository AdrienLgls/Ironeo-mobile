import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';

// Base skeleton with gold-tinted shimmer (translateX -100% → 100%, 2.5s ease-in-out infinite)
// Matches web: bg-white/[0.04] + gradient via-white/[0.02]

const SkeletonBase = memo(function SkeletonBase({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerX]);

  const shimmerTranslate = shimmerX.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-100%', '100%'],
  });

  return (
    <View style={[styles.base, style]}>
      {children}
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX: shimmerTranslate as unknown as number }] },
        ]}
      />
    </View>
  );
});

/** Rectangular skeleton block */
export const SkeletonBox = memo(function SkeletonBox({
  width,
  height,
  borderRadius = 10,
  style,
}: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonBase
      style={[
        { width: width as number, height: height as number, borderRadius },
        style as ViewStyle,
      ]}
    />
  );
});

/** Text line skeleton */
export const SkeletonText = memo(function SkeletonText({
  width = '100%',
  height = 14,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonBase
      style={[
        { width: width as number, height, borderRadius: 6 },
        style as ViewStyle,
      ]}
    />
  );
});

/** Circle skeleton (avatars, icons) */
export const SkeletonCircle = memo(function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonBase
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        style as ViewStyle,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});

export default SkeletonBase;
