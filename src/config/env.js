export const CONFIG = {
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  GEMINI_MODEL: 'gemini-3.6-flash',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  APPLOVIN_SDK_KEY: process.env.EXPO_PUBLIC_APPLOVIN_SDK_KEY || '',
  APPLOVIN_REWARDED_AD_UNIT_ID: process.env.EXPO_PUBLIC_APPLOVIN_REWARDED_AD_UNIT_ID || '',
  APPLOVIN_INTERSTITIAL_AD_UNIT_ID: process.env.EXPO_PUBLIC_APPLOVIN_INTERSTITIAL_AD_UNIT_ID || '',
  APPLOVIN_BANNER_AD_UNIT_ID: process.env.EXPO_PUBLIC_APPLOVIN_BANNER_AD_UNIT_ID || '',
  BANNER_POSITION: 'bottom',
};

export const isSupabaseConfigured = () =>
  Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

export const isGeminiConfigured = () => Boolean(CONFIG.GEMINI_API_KEY);

export const isAppLovinConfigured = () =>
  Boolean(CONFIG.APPLOVIN_SDK_KEY && CONFIG.APPLOVIN_REWARDED_AD_UNIT_ID);

export const TIER_CONFIG = {
  free: {
    dailyScans: 5,
    dailyAdBonuses: 5,
    questions: 5,
    flashcards: 5,
  },
  pro: {
    monthlyScans: 300,
    minQuestions: 15,
    maxQuestions: 20,
    minFlashcards: 15,
    maxFlashcards: 20,
  },
};

export const FREE_SCAN_LIMIT = TIER_CONFIG.free.dailyScans;
export const GEMINI_MODEL = CONFIG.GEMINI_MODEL;

export const getGeminiEndpoint = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
