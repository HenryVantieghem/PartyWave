/**
 * CropInterface Component
 * Handles image cropping with pinch-to-zoom and drag gestures
 * 16:9 aspect ratio crop frame
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  clamp,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { calculateCropDimensions } from '@/lib/camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = 16 / 9;
const PADDING = Spacing.base * 2;

interface CropInterfaceProps {
  imageUri: string;
  onConfirm: (cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  onCancel: () => void;
}

export function CropInterface({ imageUri, onConfirm, onCancel }: CropInterfaceProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  // Crop frame dimensions
  const cropFrame = calculateCropDimensions(
    {
      width: containerSize.width - PADDING * 2,
      height: containerSize.height - 200, // Leave space for controls
    },
    ASPECT_RATIO
  );

  const cropFrameX = (containerSize.width - cropFrame.width) / 2;
  const cropFrameY = (containerSize.height - cropFrame.height) / 2 - 50;

  // Image transform values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Load image dimensions
  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });
        // Calculate initial scale to fill crop frame
        const scaleX = cropFrame.width / width;
        const scaleY = cropFrame.height / height;
        const initialScale = Math.max(scaleX, scaleY) * 1.2; // Slightly larger to allow adjustment
        scale.value = initialScale;
        savedScale.value = initialScale;
      },
      (error) => {
        console.error('Error loading image size:', error);
      }
    );
  }, [imageUri]);

  // Pan gesture (drag)
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newX = savedTranslateX.value + e.translationX;
      const newY = savedTranslateY.value + e.translationY;

      // Calculate bounds based on current scale
      const scaledWidth = imageSize.width * scale.value;
      const scaledHeight = imageSize.height * scale.value;

      const maxX = (scaledWidth - cropFrame.width) / 2;
      const maxY = (scaledHeight - cropFrame.height) / 2;

      translateX.value = clamp(newX, -maxX, maxX);
      translateY.value = clamp(newY, -maxY, maxY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture (zoom)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      // Clamp scale between 1x and 3x
      scale.value = clamp(newScale, 1, 3);
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      // Recalculate bounds and clamp position
      const scaledWidth = imageSize.width * scale.value;
      const scaledHeight = imageSize.height * scale.value;

      const maxX = Math.max(0, (scaledWidth - cropFrame.width) / 2);
      const maxY = Math.max(0, (scaledHeight - cropFrame.height) / 2);

      translateX.value = clamp(translateX.value, -maxX, maxX);
      translateY.value = clamp(translateY.value, -maxY, maxY);

      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combined gesture
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated image style
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleConfirm = () => {
    if (imageSize.width === 0 || imageSize.height === 0) {
      // Fallback: crop entire image
      onConfirm({
        x: 0,
        y: 0,
        width: imageSize.width || 1920,
        height: imageSize.height || 1080,
      });
      return;
    }

    // Calculate the displayed image dimensions
    const displayedWidth = imageSize.width * scale.value;
    const displayedHeight = imageSize.height * scale.value;

    // Calculate the image's position on screen (centered + translation)
    const imageScreenX = containerSize.width / 2 + translateX.value;
    const imageScreenY = containerSize.height / 2 + translateY.value;

    // Calculate crop frame position relative to image
    const cropFrameScreenX = cropFrameX;
    const cropFrameScreenY = cropFrameY;

    // Convert screen coordinates to image coordinates
    // The crop frame's top-left corner relative to image's top-left corner
    const relativeX = cropFrameScreenX - (imageScreenX - displayedWidth / 2);
    const relativeY = cropFrameScreenY - (imageScreenY - displayedHeight / 2);

    // Convert to actual image coordinates (divide by scale)
    const cropX = Math.max(0, relativeX / scale.value);
    const cropY = Math.max(0, relativeY / scale.value);
    const cropWidth = Math.min(cropFrame.width / scale.value, imageSize.width - cropX);
    const cropHeight = Math.min(cropFrame.height / scale.value, imageSize.height - cropY);

    // Ensure valid crop
    const finalCropX = Math.max(0, Math.min(cropX, imageSize.width - cropWidth));
    const finalCropY = Math.max(0, Math.min(cropY, imageSize.height - cropHeight));
    const finalCropWidth = Math.max(1, Math.min(cropWidth, imageSize.width - finalCropX));
    const finalCropHeight = Math.max(1, Math.min(cropHeight, imageSize.height - finalCropY));

    onConfirm({
      x: finalCropX,
      y: finalCropY,
      width: finalCropWidth,
      height: finalCropHeight,
    });
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
      {/* Image with gestures */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: imageUri }}
            style={[styles.image, imageStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>

      {/* Overlay with crop frame */}
      <View style={styles.overlay}>
        {/* Top dark area */}
        <View style={[styles.overlaySection, { height: cropFrameY }]} />

        {/* Middle section with crop frame */}
        <View style={styles.middleSection}>
          {/* Left dark area */}
          <View style={[styles.overlaySection, { width: cropFrameX }]} />

          {/* Crop frame */}
          <View style={[styles.cropFrame, { width: cropFrame.width, height: cropFrame.height }]}>
            <View style={styles.cropFrameBorder} />
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Right dark area */}
          <View style={[styles.overlaySection, { width: cropFrameX }]} />
        </View>

        {/* Bottom dark area */}
        <View style={[styles.overlaySection, { flex: 1 }]} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <BlurView intensity={80} tint="dark" style={styles.controlsBlur}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color={Colors.white} />
            <Text variant="body" weight="semibold" color="white" style={{ marginLeft: Spacing.sm }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <Button variant="primary" onPress={handleConfirm} style={styles.confirmButton}>
            <Ionicons name="checkmark" size={20} color={Colors.white} />
            <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
              Confirm
            </Text>
          </Button>
        </BlurView>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text variant="caption" color="secondary" style={styles.instructionText}>
          Pinch to zoom • Drag to reposition
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  middleSection: {
    flexDirection: 'row',
  },
  cropFrame: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'visible',
  },
  cropFrameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BorderRadius.md,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BorderRadius.md,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BorderRadius.md,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BorderRadius.md,
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  confirmButton: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  instructions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});

