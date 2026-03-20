import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  removeToast: (id: number) => void;
}

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: string; color: string }> = {
  success: { bg: '#0f1f15', icon: '✓', color: '#22c55e' },
  error:   { bg: '#1f0f0f', icon: '✗', color: '#ef4444' },
  warning: { bg: '#1f1a0f', icon: '⚠', color: '#eab308' },
  info:    { bg: '#0f151f', icon: 'ℹ', color: '#3b82f6' },
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const config = TOAST_CONFIG[item.type];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
    ]).start(() => onClose(item.id));
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={[styles.toastIcon, { color: config.color }]}>{config.icon}</Text>
      <Text style={styles.toastMessage}>{item.message}</Text>
      <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (msg: string, d?: number) => addToast('success', msg, d),
      error:   (msg: string, d?: number) => addToast('error',   msg, d),
      warning: (msg: string, d?: number) => addToast('warning', msg, d),
      info:    (msg: string, d?: number) => addToast('info',    msg, d),
    }),
    [addToast]
  );

  const value = useMemo(() => ({ toast, removeToast }), [toast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.container, { top: insets.top + 8 }]}
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} item={item} onClose={removeToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx.toast;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
    ...Platform.select({ android: { elevation: 9999 } }),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  toastIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
  },
  closeIcon: {
    fontSize: 14,
    color: '#a0a0a0',
  },
});
