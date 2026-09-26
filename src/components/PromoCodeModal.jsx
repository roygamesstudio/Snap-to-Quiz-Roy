import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { redeemPromoCode } from '../services/creditService';

export default function PromoCodeModal({ visible, onClose, onRedeemed, toast }) {
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit() {
    if (!code.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const res = await redeemPromoCode(code);
    setLoading(false);

    if (res?.success) {
      setResult({ success: true, credits: res.credits_awarded });
      toast.success(`Promo code applied! +${res.credits_awarded} credits added.`);
      if (onRedeemed) await onRedeemed();
      setTimeout(() => {
        setCode('');
        setResult(null);
        onClose();
      }, 2500);
    } else {
      setResult({
        success: false,
        error:
          res?.error ||
          'This promo code is invalid or does not exist. Please check the code and try again.',
      });
    }
  }

  function handleClose() {
    setCode('');
    setResult(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.successLight }]}>
                <Ionicons name="ticket-outline" size={20} color={theme.success} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Redeem Promo Code</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Enter a promo code to receive bonus scan credits.
            </Text>

            {result?.success && (
              <View style={[styles.successBox, { backgroundColor: theme.successLight, borderColor: theme.success }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.successText, { color: theme.success }]}>
                  {result.credits} credits added to your account!
                </Text>
              </View>
            )}

            {result && !result.success && (
              <View style={[styles.errorBox, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
                <Ionicons name="alert-circle" size={20} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {result.error}
                </Text>
              </View>
            )}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              placeholder="Enter promo code"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              textAlign="center"
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.success }]}
              onPress={handleSubmit}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <View style={styles.submitContent}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.submitText}>Redeeming...</Text>
                </View>
              ) : (
                <View style={styles.submitContent}>
                  <Ionicons name="ticket-outline" size={18} color="#FFF" />
                  <Text style={styles.submitText}>Redeem Code</Text>
                </View>
              )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
