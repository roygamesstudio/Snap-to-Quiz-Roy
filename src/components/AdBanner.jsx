import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getBannerAdUnitId,
  isBannerConfigured,
  getBannerPosition,
  AppLovinMAX,
} from '../services/adService';
import { useTheme } from '../context/ThemeContext';

export default function AdBanner() {
  const { theme } = useTheme();

  if (!isBannerConfigured() || !AppLovinMAX) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.placeholderInner}>
          <View style={[styles.placeholderBadge, { backgroundColor: theme.primaryLight }]}>
            <View style={[styles.placeholderText, { backgroundColor: theme.primary }]} />
          </View>
        </View>
      </View>
    );
  }

  const position = getBannerPosition();
  const AdView = AppLovinMAX.AdView;

  if (!AdView) return null;

  return (
    <SafeAreaView edges={position === 'top' ? ['top'] : ['bottom']} style={{ backgroundColor: theme.surface }}>
      <View style={styles.bannerContainer}>
        <AdView
          adUnitId={getBannerAdUnitId()}
          adFormat="banner"
          placement={position}
          style={styles.banner}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInner: {
    alignItems: 'center',
  },
  placeholderBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  placeholderText: {
    width: 120,
    height: 8,
    borderRadius: 4,
  },
  bannerContainer: {
    width: '100%',
  },
  banner: {
    width: '100%',
    height: Platform.OS === 'ios' ? 60 : 50,
  },
});
