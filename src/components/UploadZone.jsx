import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

const MAX_SIZE = 10 * 1024 * 1024;

export default function UploadZone({ onResult, onError, onScanStart, onRequireAuth }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleImage(base64, mimeType, uri) {
    if (!onRequireAuth()) return;
    setPreview(uri);
    setLoading(true);
    onScanStart();
    try {
      await onResult(base64, mimeType);
    } catch (err) {
      onError(err.message || 'Failed to process the image.');
    } finally {
      setLoading(false);
    }
  }

  async function pickFromGallery() {
    if (!onRequireAuth()) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      onError('Permission to access photos is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    handleImage(asset.base64, asset.mimeType || 'image/jpeg', asset.uri);
  }

  async function takePhoto() {
    if (!onRequireAuth()) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      onError('Permission to access the camera is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    handleImage(asset.base64, asset.mimeType || 'image/jpeg', asset.uri);
  }

  function clearPreview() {
    setPreview(null);
  }

  if (preview) {
    return (
      <View style={[styles.previewContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="contain" />
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Analyzing your image with AI...
              </Text>
            </View>
          </View>
        )}
        {!loading && (
          <TouchableOpacity style={styles.clearButton} onPress={clearPreview}>
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.uploadZone, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.uploadContent}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="image-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.uploadTitle, { color: theme.text }]}>
          Upload your lecture notes or textbook page
        </Text>
        <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>
          Take a photo or choose from gallery. JPG and PNG supported.
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={pickFromGallery}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
            <Text style={styles.primaryButtonText}>Choose File</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.primaryLight }]}
            onPress={takePhoto}
          >
            <Ionicons name="camera-outline" size={18} color={theme.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  uploadContent: {
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#F1F5F9',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 8,
  },
});
