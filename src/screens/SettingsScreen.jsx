import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { getCredits, isPremium } from '../services/creditService';
import AuthModal from '../components/AuthModal';

export default function SettingsScreen({ navigation }) {
  const { theme, themeMode, toggleTheme } = useTheme();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [premium, setPremium] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      const c = await getCredits();
      setCredits(c);
      const p = await isPremium();
      setPremium(p);
    } else {
      setUser(null);
      setCredits(0);
      setPremium(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setCredits(0);
    setPremium(false);
    toast.info('Signed out.');
  }

  async function handleAuthSuccess() {
    await refreshUser();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {user ? (
            <>
              <View style={styles.profileRow}>
                <View style={[styles.profileIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="person" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emailText, { color: theme.text }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <Text style={[styles.creditSub, { color: theme.textSecondary }]}>
                    {credits} credits · {premium ? 'Premium' : 'Free'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.signOutButton, { borderColor: theme.error }]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={18} color={theme.error} />
                <Text style={[styles.signOutText, { color: theme.error }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.primary }]}
              onPress={() => setAuthOpen(true)}
            >
              <Ionicons name="log-in-outline" size={18} color="#FFF" />
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          Appearance
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.themeRow}>
            <View style={styles.themeLeft}>
              <Ionicons
                name={themeMode === 'dark' ? 'moon' : 'sunny'}
                size={22}
                color={theme.primary}
              />
              <View>
                <Text style={[styles.themeLabel, { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.themeSub, { color: theme.textSecondary }]}>
                  Switch between light and dark themes
                </Text>
              </View>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          About
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.aboutRow}>
            <Ionicons name="information-circle-outline" size={22} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutLabel, { color: theme.text }]}>PhotoQuizzer</Text>
              <Text style={[styles.aboutSub, { color: theme.textSecondary }]}>Version 1.0.0</Text>
            </View>
          </View>
          <View style={[styles.aboutRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
            <Ionicons name="warning-outline" size={22} color={theme.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.aboutLabel, { color: theme.text }]}>AI Accuracy</Text>
              <Text style={[styles.aboutSub, { color: theme.textSecondary }]}>
                AI-generated content may contain inaccuracies. Verify critical facts.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
  },
  creditSub: {
    fontSize: 13,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeSub: {
    fontSize: 13,
    marginTop: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  aboutSub: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
});
