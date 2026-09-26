import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { showRewardedAd, isRewardedAdReady } from '../services/adService';
import { addCredit } from '../services/creditService';

export default function GetCreditsModal({ visible, onClose, onCreditGranted, onOpenPromoCode, toast }) {
  const { theme } = useTheme();
  const [watching, setWatching] = useState(false);

  async function handleWatchAd() {
    if (watching) return;
    setWatching(true);

    if (!isRewardedAdReady()) {
      toast.error('Ad is currently loading or unavailable. Please check your internet connection or try again in a moment.');
      setWatching(false);
      return;
    }

    showRewardedAd(
      async () => {
        try {
          const ok = await addCredit(1);
          if (ok) {
            toast.success('Reward earned! +1 credit added.');
            if (onCreditGranted) await onCreditGranted();
          } else {
            toast.error('Could not grant reward. You may have reached the daily ad bonus limit.');
          }
        } catch (_) {
          toast.error('An error occurred while granting your reward.');
        } finally {
          setWatching(false);
        }
      },
      () => {
        toast.error('Ad is currently loading or unavailable. Please check your internet connection or try again in a moment.');
        setWatching(false);
      }
    );
  }

  function handlePromoCode() {
    onClose();
    if (onOpenPromoCode) onOpenPromoCode();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="gift-outline" size={22} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Get Credits</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Choose an option below to add credits
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.success }]}
              onPress={handleWatchAd}
              disabled={watching}
            >
              {watching ? (
                <View style={styles.actionContent}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.actionText}>Verifying ad view...</Text>
                </View>
              ) : (
                <View style={styles.actionContent}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="play-outline" size={20} color="#FFF" />
                  </View>
                  <View style={styles.actionTextGroup}>
                    <Text style={styles.actionTitle}>Watch Ad (+1 Credit)</Text>
                    <Text style={styles.actionSubtitle}>Earn a free credit instantly</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR</Text>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handlePromoCode}
            >
              <View style={styles.actionContent}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="ticket-outline" size={20} color="#FFF" />
                </View>
                <View style={styles.actionTextGroup}>
                  <Text style={styles.actionTitle}>Enter Promo Code</Text>
                  <Text style={styles.actionSubtitle}>Redeem code for instant credits</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Keep scanning and learning with PhotoQuizzer
            </Text>
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
    borderRadius: 24,
    overflow: 'hidden',
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  actionButton: {
    borderRadius: 16,
    padding: 16,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextGroup: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
