import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarCircleProps {
  pseudo: string;
  size?: number;
  borderColor?: string;
}

const AvatarCircle = memo(function AvatarCircle({ pseudo, size = 40, borderColor }: AvatarCircleProps) {
  const initials = pseudo.slice(0, 2).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        borderColor ? { borderWidth: 2, borderColor } : undefined,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
});

export default AvatarCircle;

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'rgba(239,191,4,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#EFBF04',
    fontFamily: 'Quilon-Medium',
    fontWeight: '600',
  },
});
