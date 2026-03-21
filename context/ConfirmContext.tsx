import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hapticWarning } from '../utils/haptics';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      opacity.setValue(0);
      scale.setValue(0.95);
      translateY.setValue(20);
      if (options.destructive) {
        hapticWarning().catch(() => undefined);
      }
      setPending({ options, resolve });
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 25,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [opacity, scale, translateY]);

  const handleResolve = useCallback(
    (value: boolean) => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        const resolve = pending?.resolve;
        setPending(null);
        resolve?.(value);
      });
    },
    [opacity, pending]
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        visible={pending !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => handleResolve(false)}
      >
        <Animated.View style={[styles.overlay, { opacity }]}>
          <Animated.View
            style={[
              styles.card,
              { transform: [{ scale }, { translateY }] },
            ]}
          >
            <Text style={styles.title}>{pending?.options.title}</Text>
            <Text style={styles.message}>{pending?.options.message}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.cancelButton}
                onPress={() => handleResolve(false)}
              >
                <Text style={styles.cancelText}>
                  {pending?.options.cancelText ?? 'Annuler'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.confirmButton,
                  pending?.options.destructive && styles.destructiveButton,
                ]}
                onPress={() => handleResolve(true)}
              >
                <Text
                  style={[
                    styles.confirmText,
                    pending?.options.destructive && styles.destructiveText,
                  ]}
                >
                  {pending?.options.confirmText ?? 'Confirmer'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx.confirm;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Quilon-Medium',
    color: '#ffffff',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Rowan-Regular',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Rowan-Regular',
    color: '#ffffff',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#EFBF04',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  confirmText: {
    fontSize: 14,
    fontFamily: 'Quilon-Medium',
    color: '#121212',
  },
  destructiveText: {
    color: '#ffffff',
  },
});
