import React, { useEffect, useRef, memo } from 'react';
import { Animated, ViewStyle } from 'react-native';

// Matches web FadeIn: opacity 0→1, duration 0.3-0.6s, optional delay, easeOut
// Also includes FadeInUp, ScaleIn, SlideInLeft, SlideInRight

interface AnimProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

/** FadeIn — opacity 0→1 */
export const FadeIn = memo(function FadeIn({ children, duration = 300, delay = 0, style }: AnimProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, delay]);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
});

/** FadeInUp — opacity 0→1 + translateY 30→0, 0.6s easeOut */
export const FadeInUp = memo(function FadeInUp({ children, duration = 600, delay = 0, style }: AnimProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, duration, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
});

/** ScaleIn — opacity 0→1 + scale 0.9→1, 0.5s easeOut */
export const ScaleIn = memo(function ScaleIn({ children, duration = 500, delay = 0, style }: AnimProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, duration, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
});

/** SlideInLeft — opacity 0→1 + translateX -30→0 */
export const SlideInLeft = memo(function SlideInLeft({ children, duration = 600, delay = 0, style }: AnimProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateX, duration, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
});

/** StaggerChildren — wraps children with sequential FadeInUp delays */
export const StaggerChildren = memo(function StaggerChildren({
  children,
  staggerMs = 80,
  baseDelay = 0,
}: {
  children: React.ReactNode;
  staggerMs?: number;
  baseDelay?: number;
}) {
  return (
    <>
      {React.Children.map(children, (child, i) =>
        child ? (
          <FadeInUp key={i} delay={baseDelay + i * staggerMs}>
            {child}
          </FadeInUp>
        ) : null
      )}
    </>
  );
});

export default FadeIn;
