import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import AppNavigator from './navigation/AppNavigator';
import OfflineNotice from './components/OfflineNotice';
import RemoteUpdateModal from './components/RemoteUpdateModal';
import ThemeOnboardingModal from './components/ThemeOnboardingModal';
import { initAdSDK } from './services/adService';

function AppContent() {
  const { theme, modalShown, dismissThemeModal } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  useEffect(() => {
    initAdSDK();
  }, []);

  useEffect(() => {
    if (!modalShown) {
      setThemeModalVisible(true);
    }
  }, [modalShown]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <OfflineNotice />
      <AppNavigator />
      <RemoteUpdateModal />
      <ThemeOnboardingModal
        visible={themeModalVisible}
        onClose={() => {
          setThemeModalVisible(false);
          dismissThemeModal();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
