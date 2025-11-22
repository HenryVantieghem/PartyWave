/**
 * CameraCapture Component
 * Main camera interface with live preview and controls
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { VibesOverlay } from './VibesOverlay';
import { VibeTag } from '@/types/party';
import * as Haptics from 'expo-haptics';

interface CameraCaptureProps {
  vibes?: VibeTag[];
  onCapturedPhoto: (photoUri: string) => void;
  onClose: () => void;
}

export function CameraCapture({ vibes = [], onCapturedPhoto, onClose }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off' | 'auto'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Request permission on mount
  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in Settings to take photos.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  }, [permission]);

  const handleFlipCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleToggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo?.uri) {
        onCapturedPhoto(photo.uri);
      }
    } catch (error: any) {
      console.error('Capture error:', error);
      Alert.alert('Capture Failed', error.message || 'Failed to take photo');
    } finally {
      setIsCapturing(false);
    }
  };

  // Permission denied view
  if (permission && !permission.granted) {
    return (
      <View style={styles.container}>
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.text.secondary} />
          <Text variant="h3" weight="bold" style={styles.permissionTitle}>
            Camera Access Needed
          </Text>
          <Text variant="body" color="secondary" style={styles.permissionText}>
            We need camera access to capture party photos
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            <Text variant="button" weight="bold" color="white">
              Grant Permission
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text variant="body" color="secondary">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      >
        {/* Header */}
        <View style={styles.header}>
          <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text variant="h4" weight="bold" color="white">
                Capture Photo
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </BlurView>
        </View>

        {/* Vibes Overlay */}
        {vibes.length > 0 && <VibesOverlay vibes={vibes} />}

        {/* Controls */}
        <View style={styles.controls}>
          <BlurView intensity={80} tint="dark" style={styles.controlsBlur}>
            {/* Flash Toggle */}
            <TouchableOpacity
              onPress={handleToggleFlash}
              style={styles.controlButton}
            >
              <Ionicons
                name={
                  flash === 'on'
                    ? 'flash'
                    : flash === 'auto'
                    ? 'flash-outline'
                    : 'flash-off'
                }
                size={24}
                color={flash === 'on' ? Colors.primary : Colors.white}
              />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isCapturing}
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Flip Camera */}
            <TouchableOpacity
              onPress={handleFlipCamera}
              style={styles.controlButton}
            >
              <Ionicons name="camera-reverse" size={24} color={Colors.white} />
            </TouchableOpacity>
          </BlurView>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  permissionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  closeButton: {
    paddingVertical: Spacing.sm,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
  controlsBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.white,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
  },
});

