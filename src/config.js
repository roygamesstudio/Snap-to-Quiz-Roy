import { CURRENCIES } from './lib/currency'

// Centralized configuration for Snap-to-Quiz.
// Public keys and runtime choices come from Vite environment variables.

export const config = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  ADSTERRA_KEY: import.meta.env.VITE_ADSTERRA_KEY || import.meta.env.VITE_ADSTERRA_ZONE_ID || '',
  ADSENSE_KEY: import.meta.env.VITE_ADSENSE_KEY || '',
  ADSTERRA_SCRIPT_URL: import.meta.env.VITE_ADSTERRA_SCRIPT_URL || '',
}

export const isSupabaseConfigured = () =>
  Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY)

export const isGeminiConfigured = () => Boolean(config.GEMINI_API_KEY)

export const isPaystackConfigured = () =>
  Boolean(config.PAYSTACK_PUBLIC_KEY && config.PAYSTACK_PUBLIC_KEY !== 'pk_test_dummy')

export const isAdsterraConfigured = () =>
  Boolean(
    config.ADSTERRA_KEY &&
      config.ADSTERRA_KEY !== 'test_zone_id_placeholder' &&
      config.ADSTERRA_SCRIPT_URL,
  )

export const TIER_CONFIG = {
  free: {
    dailyScans: Number(import.meta.env.VITE_FREE_DAILY_SCANS) || 5,
    dailyAdBonuses: Number(import.meta.env.VITE_FREE_DAILY_AD_BONUSES) || 5,
    questions: 5,
    flashcards: 5,
  },
  pro: {
    monthlyScans: Number(import.meta.env.VITE_PRO_MONTHLY_SCANS) || 300,
    minQuestions: 15,
    maxQuestions: 20,
    minFlashcards: 15,
    maxFlashcards: 20,
  },
}

export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || ''

export { CURRENCIES }

export const FREE_SCAN_LIMIT = TIER_CONFIG.free.dailyScans
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash'

// Helper function to build the endpoint URL dynamically using the environment key
export const getGeminiEndpoint = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.GEMINI_API_KEY}`