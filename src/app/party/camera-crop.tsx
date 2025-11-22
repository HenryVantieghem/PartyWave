/**
 * Camera Crop Screen
 * Handles image cropping and upload
 */

import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CropInterface } from '@/components/camera/CropInterface';
import { cropImage, compressImage, uploadToSupabase } from '@/lib/camera';
import { Colors, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function CameraCropScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const photoUri = params.photoUri as string;
  const vibes = params.vibes as string | undefined;

  if (!photoUri) {
    Alert.alert('Error', 'No photo to crop');
    router.back();
    return null;
  }

  const handleConfirm = async (cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    try {
      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Step 1: Crop image
      const croppedUri = await cropImage(photoUri, cropData);

      // Step 2: Compress image
      const compressedUri = await compressImage(croppedUri);

      // Step 3: Upload to Supabase
      const filename = `party_cover_${Date.now()}.jpg`;
      const publicUrl = await uploadToSupabase(
        compressedUri,
        filename,
        (progress) => {
          setUploadProgress(progress.progress);
          if (progress.error) {
            throw new Error(progress.error);
          }
        }
      );

      // Step 4: Navigate back to quick-create with image URL
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/party/quick-create',
        params: {
          photoUri: compressedUri,
          imageUrl: publicUrl,
          vibes,
        },
      });
    } catch (error: any) {
      console.error('Crop/upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to process and upload image. Please try again.',
        [
          { text: 'Retry', onPress: () => handleConfirm(cropData) },
          { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
        ]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isUploading) {
    return (
      <View style={styles.uploadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <CropInterface
        imageUri={photoUri}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
    padding: Spacing['2xl'],
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    marginTop: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});

