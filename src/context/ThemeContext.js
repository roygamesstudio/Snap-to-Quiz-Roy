import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from './themes';

const THEME_STORAGE_KEY = '@photoquizzer_theme';
const THEME_MODAL_KEY = '@photoquizzer_theme_modal_shown';

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(themes.light);
  const [themeMode, setThemeMode] = useState('light');
  const [modalShown, setModalShown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setThemeMode(saved);
          setTheme(themes[saved]);
        }
        const shown = await AsyncStorage.getItem(THEME_MODAL_KEY);
        setModalShown(shown === 'true');
      } catch (_) {}
    })();
  }, []);

  const toggleTheme = async () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    setTheme(themes[next]);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (_) {}
  };

  const dismissThemeModal = async () => {
    setModalShown(true);
    try {
      await AsyncStorage.setItem(THEME_MODAL_KEY, 'true');
    } catch (_) {}
  };

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, toggleTheme, modalShown, dismissThemeModal }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
