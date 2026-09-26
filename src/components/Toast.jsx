import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

export function ToastProvider({ children }) {
  const { theme } = useTheme();
  const [toast, setToast] = useState(null);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now();
      setToast({ id, message, type });
      if (duration > 0) {
        setTimeout(() => {
          setToast((prev) => (prev && prev.id === id ? null : prev));
        }, duration);
      }
    },
    []
  );

  const toastApi = {
    show,
    success: (msg, d) => show(msg, 'success', d),
    error: (msg, d) => show(msg, 'error', d),
    info: (msg, d) => show(msg, 'info', d),
  };

  const bgColors = {
    success: theme.successLight,
    error: theme.errorLight,
    info: theme.infoLight,
  };
  const textColors = {
    success: theme.success,
    error: theme.error,
    info: theme.info,
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <Modal visible={!!toast} transparent animationType="fade" onRequestClose={dismiss}>
        <View style={styles.overlay}>
          {toast && (
            <View
              style={[
                styles.toast,
                {
                  backgroundColor: bgColors[toast.type] || theme.infoLight,
                  borderColor: textColors[toast.type] || theme.info,
                },
              ]}
            >
              <Ionicons
                name={ICONS[toast.type] || 'information-circle'}
                size={20}
                color={textColors[toast.type] || theme.info}
              />
              <Text
                style={[styles.message, { color: theme.text, flex: 1 }]}
                numberOfLines={4}
              >
                {toast.message}
              </Text>
              <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '100%',
    minWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
