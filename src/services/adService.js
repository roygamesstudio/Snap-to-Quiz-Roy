import { CONFIG, isAppLovinConfigured } from '../config/env';

let AppLovinMAX = null;
let sdkInitialized = false;
let interstitialReady = false;
let rewardedReady = false;

const INTERSTITIAL_AD_UNIT_ID = CONFIG.APPLOVIN_INTERSTITIAL_AD_UNIT_ID;
const REWARDED_AD_UNIT_ID = CONFIG.APPLOVIN_REWARDED_AD_UNIT_ID;
const BANNER_AD_UNIT_ID = CONFIG.APPLOVIN_BANNER_AD_UNIT_ID;

export function initAdSDK() {
  if (!isAppLovinConfigured()) {
    return;
  }
  try {
    AppLovinMAX = require('react-native-applovin-max').default;
  } catch (_) {
    AppLovinMAX = null;
    return;
  }

  if (!AppLovinMAX) return;

  AppLovinMAX.initialize(CONFIG.APPLOVIN_SDK_KEY, (cfg) => {
    sdkInitialized = true;
    preloadInterstitial();
    preloadRewarded();
  });
}

export function preloadInterstitial() {
  if (!AppLovinMAX || !INTERSTITIAL_AD_UNIT_ID) return;
  try {
    AppLovinMAX.loadInterstitial(INTERSTITIAL_AD_UNIT_ID);
  } catch (_) {}
}

export function preloadRewarded() {
  if (!AppLovinMAX || !REWARDED_AD_UNIT_ID) return;
  try {
    AppLovinMAX.loadRewardedAd(REWARDED_AD_UNIT_ID);
  } catch (_) {}
}

export function isInterstitialReady() {
  if (!AppLovinMAX || !INTERSTITIAL_AD_UNIT_ID) return false;
  try {
    return AppLovinMAX.isInterstitialReady(INTERSTITIAL_AD_UNIT_ID);
  } catch (_) {
    return false;
  }
}

export function isRewardedAdReady() {
  if (!AppLovinMAX || !REWARDED_AD_UNIT_ID) return false;
  try {
    return AppLovinMAX.isRewardedAdReady(REWARDED_AD_UNIT_ID);
  } catch (_) {
    return false;
  }
}

export function showInterstitial(onClosed) {
  if (!AppLovinMAX || !INTERSTITIAL_AD_UNIT_ID) {
    if (onClosed) onClosed();
    return;
  }
  try {
    if (!isInterstitialReady()) {
      if (onClosed) onClosed();
      return;
    }
    AppLovinMAX.showInterstitial(INTERSTITIAL_AD_UNIT_ID);
    if (onClosed) onClosed();
    preloadInterstitial();
  } catch (_) {
    if (onClosed) onClosed();
  }
}

export async function showRewardedAd(onReward, onUnavailable) {
  if (!AppLovinMAX || !REWARDED_AD_UNIT_ID) {
    if (onUnavailable) onUnavailable();
    return;
  }

  try {
    if (!isRewardedAdReady()) {
      if (onUnavailable) onUnavailable();
      return;
    }

    AppLovinMAX.showRewardedAd(REWARDED_AD_UNIT_ID);

    // The AppLovin MAX SDK emits events for reward completion.
    // We use a timeout fallback to grant the reward after a minimum watch duration.
    // In production, wire onUserRewarded and onAdHidden events from the SDK.
    setTimeout(() => {
      if (onReward) onReward();
      preloadRewarded();
    }, 5000);
  } catch (_) {
    if (onUnavailable) onUnavailable();
  }
}

export function getBannerAdUnitId() {
  return BANNER_AD_UNIT_ID || null;
}

export function isBannerConfigured() {
  return Boolean(BANNER_AD_UNIT_ID);
}

export function getBannerPosition() {
  return CONFIG.BANNER_POSITION || 'bottom';
}

export { AppLovinMAX };
