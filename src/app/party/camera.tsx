/**
 * Camera Screen
 * Full-screen camera capture interface
 */

import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { VibeTag } from '@/types/party';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse vibes from params
  const vibes: VibeTag[] = params.vibes
    ? (typeof params.vibes === 'string'
        ? params.vibes.split(',')
        : params.vibes) as VibeTag[]
    : [];

  const handleCapturedPhoto = (photoUri: string) => {
    // Navigate to crop screen with photo URI
    router.push({
      pathname: '/party/camera-crop',
      params: {
        photoUri,
        vibes: vibes.join(','),
      },
    });
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <CameraCapture
      vibes={vibes}
      onCapturedPhoto={handleCapturedPhoto}
      onClose={handleClose}
    />
  );
}

