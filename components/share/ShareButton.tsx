import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Share } from 'react-native';
import ViewShot from 'react-native-view-shot';

export interface ShareButtonProps {
  cardRef: React.RefObject<ViewShot | null>;
  label?: string;
}

export default function ShareButton({ cardRef, label = 'Partager' }: ShareButtonProps) {
  const handlePress = async () => {
    try {
      const uri = await cardRef.current?.capture?.();
      if (!uri) return;
      await Share.share({
        url: uri,
        message: 'Partagez vos performances avec Ironeo 💪 #ironeo',
      });
    } catch {
      // silent
    }
  };

  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handlePress}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(239,191,4,0.15)',
    borderWidth: 1,
    borderColor: '#EFBF04',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  label: {
    fontFamily: 'Quilon-Medium',
    fontSize: 15,
    color: '#EFBF04',
  },
});
