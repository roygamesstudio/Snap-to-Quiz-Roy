import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getAppConfig } from '../services/creditService';

export default function RemoteUpdateModal() {
  const { theme } = useTheme();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    (async () => {
      const cfg = await getAppConfig();
      if (cfg && cfg.is_active) {
        setConfig(cfg);
      }
    })();
  }, []);

  function handleOpenUrl() {
    if (config?.target_url) {
      Linking.openURL(config.target_url).catch(() => {});
    }
  }

  function handleClose() {
    setConfig(null);
  }

  return (
    <Modal
      visible={!!config}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="download-outline" size={24} color={theme.primary} />
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {config?.title || 'Update Available'}
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {config?.message || 'A new version is available. Please update your app.'}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.laterButton, { borderColor: theme.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.laterText, { color: theme.textSecondary }]}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: theme.primary }]}
              onPress={handleOpenUrl}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color="#FFF" />
              <Text style={styles.updateText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  laterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  laterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  updateText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
