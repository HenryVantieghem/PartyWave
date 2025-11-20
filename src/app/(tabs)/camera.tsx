import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        // Navigate to preview/edit screen
        router.push({
          pathname: '/camera/preview',
          params: { uri: photo.uri },
        });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/camera/preview',
          params: { uri: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text variant="body" color="secondary">
              Requesting camera permission...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={Colors.primary} />
            <Text variant="h3" weight="bold" center style={styles.permissionTitle}>
              Camera Access Required
            </Text>
            <Text variant="body" center color="secondary" style={styles.permissionText}>
              We need access to your camera to capture epic party moments
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text variant="body" weight="semibold" color="white">
                Grant Permission
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <Ionicons
                name={
                  flash === 'on'
                    ? 'flash'
                    : flash === 'auto'
                    ? 'flash-outline'
                    : 'flash-off'
                }
                size={28}
                color={flash === 'on' ? Colors.accent.gold : Colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.sideButton}
              onPress={pickFromLibrary}
            >
              <Ionicons name="images-outline" size={28} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonOuter}>
                <View style={styles.captureButtonInner} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse-outline" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safeArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permissionTitle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  permissionText: {
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.lg,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
  },
});
