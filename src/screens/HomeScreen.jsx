import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import UploadZone from '../components/UploadZone';
import AdBanner from '../components/AdBanner';
import GetCreditsModal from '../components/GetCreditsModal';
import PromoCodeModal from '../components/PromoCodeModal';
import AuthModal from '../components/AuthModal';
import { generateQuizFromImage, GeminiError } from '../services/geminiService';
import {
  getCredits,
  deductCredit,
  refundCredit,
  isPremium,
} from '../services/creditService';
import { supabase } from '../lib/supabase';
import { isGeminiConfigured } from '../config/env';
import { isInterstitialReady, showInterstitial } from '../services/adService';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const toast = useToast();
  const [credits, setCredits] = useState(0);
  const [premium, setPremium] = useState(false);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [getCreditsOpen, setGetCreditsOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshCredits = useCallback(async () => {
    const c = await getCredits();
    setCredits(c);
    const p = await isPremium();
    setPremium(p);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCredits();
    setRefreshing(false);
  }, [refreshCredits]);

  React.useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  React.useEffect(() => {
    if (!isGeminiConfigured()) {
      toast.info('No Gemini API key found. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
    }
  }, []);

  async function handleScan(base64, mimeType) {
    const { data: authData } = supabase
      ? await supabase.auth.getUser()
      : { data: null };
    if (!authData?.user) {
      toast.info('Sign in to claim your 5 free scans and generate your quiz!');
      setAuthOpen(true);
      return null;
    }

    if (!isGeminiConfigured()) {
      toast.error('Gemini API key is not configured. Please add it to your .env file.');
      return null;
    }

    const hasCredit = await deductCredit();
    if (!hasCredit) {
      toast.error('You have no credits left. Get credits to continue scanning.');
      setGetCreditsOpen(true);
      return null;
    }

    try {
      const res = await generateQuizFromImage(base64, mimeType, premium);

      if (isInterstitialReady()) {
        showInterstitial(() => {
          setResult(res);
          navigation.navigate('StudyHub', { result, isPremium: premium });
        });
      } else {
        setResult(res);
        navigation.navigate('StudyHub', { result, isPremium: premium });
      }

      refreshCredits();
      toast.success(`Generated ${res.questions.length} questions and ${res.flashcards.length} flashcards!`);
      return res;
    } catch (err) {
      if (err instanceof GeminiError) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong while processing your image. Please try again.');
      }
      await refundCredit();
      refreshCredits();
      return null;
    }
  }

  function requireAuthForScan() {
    return true;
  }

  async function handleAuthSuccess() {
    await refreshCredits();
  }

  async function handleCreditGranted() {
    await refreshCredits();
  }

  async function handlePromoRedeemed() {
    await refreshCredits();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="sparkles" size={15} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              AI-Powered Active Recall
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Snap a photo.{'\n'}
            <Text style={{ color: theme.primary }}>Master the material.</Text>
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Upload a photo of your lecture notes or textbook page. AI instantly
            turns it into interactive quizzes and flashcards.
          </Text>
        </View>

        <View style={styles.creditRow}>
          <View style={[styles.creditBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="flash" size={16} color={theme.warning} />
            <Text style={[styles.creditText, { color: theme.text }]}>
              {credits} credits
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.getCreditsButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              const { data } = supabase ? supabase.auth.getSession() : { data: null };
              if (!data?.session?.user) {
                setAuthOpen(true);
              } else {
                setGetCreditsOpen(true);
              }
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFF" />
            <Text style={styles.getCreditsText}>Get Credits</Text>
          </TouchableOpacity>
        </View>

        <UploadZone
          onResult={handleScan}
          onError={(msg) => toast.error(msg)}
          onScanStart={() => setScanning(true)}
          onRequireAuth={requireAuthForScan}
        />

        {!result && !scanning && (
          <View style={styles.stepsContainer}>
            {[
              { icon: 'camera-outline', title: '1. Snap or Upload', desc: 'Take a photo of your notes or pick an image from your gallery.' },
              { icon: 'brain-outline', title: '2. AI Analyzes', desc: 'Gemini AI extracts key concepts and generates questions.' },
              { icon: 'flash-outline', title: '3. Study & Test', desc: 'Quiz yourself with instant feedback or flip flashcards.' },
            ].map((step) => (
              <View key={step.title} style={[styles.stepCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.stepIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name={step.icon} size={22} color={theme.primary} />
                </View>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {!premium && !scanning && (
          <View style={{ marginTop: 24 }}>
            <AdBanner />
          </View>
        )}
      </ScrollView>

      <GetCreditsModal
        visible={getCreditsOpen}
        onClose={() => setGetCreditsOpen(false)}
        onCreditGranted={handleCreditGranted}
        onOpenPromoCode={() => setPromoOpen(true)}
        toast={toast}
      />

      <PromoCodeModal
        visible={promoOpen}
        onClose={() => setPromoOpen(false)}
        onRedeemed={handlePromoRedeemed}
        toast={toast}
      />

      <AuthModal
        visible={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        toast={toast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 120,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  creditText: {
    fontSize: 14,
    fontWeight: '600',
  },
  getCreditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  getCreditsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepsContainer: {
    gap: 12,
    marginTop: 32,
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
