/**
 * Camera Utilities
 * Handles permissions, compression, cropping, and uploads
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UploadProgress {
  progress: number; // 0-100
  error?: string;
}

/**
 * Request camera permissions (iOS/Android)
 * Note: This is a utility function. Components should use useCameraPermissions hook directly.
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { useCameraPermissions } = await import('expo-camera');
    // Note: This function is mainly for reference. 
    // Components should use the useCameraPermissions hook directly.
    // For programmatic access, you can use Camera.requestCameraPermissionsAsync()
    const { Camera } = await import('expo-camera');
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
}

/**
 * Compress image before upload
 */
export async function compressImage(
  uri: string,
  maxSize: number = 2000000 // 2MB default
): Promise<string> {
  try {
    // Get image info first
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // If still too large, compress more aggressively
    if (manipResult.width > 1920 || manipResult.height > 1080) {
      const resized = await ImageManipulator.manipulateAsync(
        manipResult.uri,
        [{ resize: { width: 1920 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return resized.uri;
    }

    return manipResult.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
}

/**
 * Crop image using crop data
 */
export async function cropImage(
  uri: string,
  cropData: CropData
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: cropData.x,
            originY: cropData.y,
            width: cropData.width,
            height: cropData.height,
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Image crop error:', error);
    throw error;
  }
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadToSupabase(
  imageUri: string,
  filename: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Read file as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const filePath = `${user.id}/${Date.now()}_${filename}`;
    const { data, error } = await supabase.storage
      .from('party-covers')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('party-covers').getPublicUrl(filePath);

    onProgress?.({ progress: 100 });
    return publicUrl;
  } catch (error: any) {
    onProgress?.({ error: error.message, progress: 0 });
    throw error;
  }
}

/**
 * Calculate crop frame dimensions for 16:9 aspect ratio
 */
export function calculateCropDimensions(
  containerSize: { width: number; height: number },
  aspectRatio: number = 16 / 9
): { width: number; height: number } {
  const { width: containerWidth, height: containerHeight } = containerSize;

  // Calculate dimensions that fit within container while maintaining aspect ratio
  let frameWidth = containerWidth;
  let frameHeight = frameWidth / aspectRatio;

  // If height exceeds container, scale down
  if (frameHeight > containerHeight) {
    frameHeight = containerHeight;
    frameWidth = frameHeight * aspectRatio;
  }

  return {
    width: frameWidth,
    height: frameHeight,
  };
}

/**
 * Get optimal image dimensions for display
 */
export function getOptimalImageDimensions(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number = SCREEN_WIDTH,
  maxHeight: number = SCREEN_HEIGHT
): { width: number; height: number } {
  const aspectRatio = imageWidth / imageHeight;

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width, height };
}

