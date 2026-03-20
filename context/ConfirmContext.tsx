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

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [opacity]);

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
          <View style={styles.card}>
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
          </View>
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
    color: '#000000',
  },
  destructiveText: {
    color: '#ffffff',
  },
});
