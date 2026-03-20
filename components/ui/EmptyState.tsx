import React, { useEffect, useRef, memo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// Matches web EmptyState: icon in rounded-2xl bg-white/[0.06], title+description+cta
// compact mode: smaller padding/icon, type='error' for visual cue

interface EmptyStateProps {
  icon?: string; // emoji or text icon
  title: string;
  description?: string;
  cta?: React.ReactNode;
  type?: 'empty' | 'error';
  compact?: boolean;
}

function EmptyState({ icon, title, description, cta, type = 'empty', compact = false }: EmptyStateProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const iconY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Icon float loop (only non-compact)
    if (!compact && icon) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconY, { toValue: -3, duration: 1500, useNativeDriver: true }),
          Animated.timing(iconY, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [opacity, translateY, iconY, compact, icon]);

  const iconSize = compact ? 40 : 56;

  return (
    <Animated.View
      style={[
        styles.container,
        compact ? styles.containerCompact : styles.containerFull,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {icon && (
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: 16,
              transform: compact ? [] : [{ translateY: iconY }],
            },
          ]}
        >
          <Text style={[styles.iconText, compact ? styles.iconTextCompact : styles.iconTextFull]}>
            {icon}
          </Text>
        </Animated.View>
      )}
      <Text
        style={[
          styles.title,
          compact ? styles.titleCompact : styles.titleFull,
          type === 'error' && styles.titleError,
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, compact ? styles.descriptionCompact : styles.descriptionFull]}>
          {description}
        </Text>
      )}
      {cta && <View style={styles.cta}>{cta}</View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerFull: {
    paddingVertical: 32,
  },
  containerCompact: {
    paddingVertical: 16,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    textAlign: 'center',
  },
  iconTextFull: {
    fontSize: 24,
  },
  iconTextCompact: {
    fontSize: 20,
  },
  title: {
    fontFamily: 'Quilon-Medium',
    color: '#fafafa',
    marginBottom: 4,
    textAlign: 'center',
  },
  titleFull: {
    fontSize: 16,
  },
  titleCompact: {
    fontSize: 14,
  },
  titleError: {
    color: '#ef4444',
  },
  description: {
    fontFamily: 'Rowan-Regular',
    color: '#a0a0a0',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  descriptionFull: {
    fontSize: 14,
  },
  descriptionCompact: {
    fontSize: 12,
  },
  cta: {
    marginTop: 16,
  },
});

export default memo(EmptyState);
