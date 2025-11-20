import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

export default function CameraPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useAuthStore();
  const { uploadMemory } = usePartyStore();
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const imageUri = params.uri as string;
  const partyId = params.partyId as string | undefined;

  const handlePost = async () => {
    if (!imageUri || !profile?.id) return;

    try {
      setIsPosting(true);

      // Upload image and create memory
      await uploadMemory(imageUri, profile.id, partyId, caption);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Photo posted to your party memories!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to the previous screen (camera or party detail)
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to post photo');
    } finally {
      setIsPosting(false);
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text variant="h3" weight="bold" center>
              No image found
            </Text>
            <Button onPress={() => router.back()} variant="primary" style={styles.button}>
              Go Back
            </Button>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleCancel}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.9)']}
          style={styles.bottomGradient}
        >
          <ScrollView style={styles.bottomContent} keyboardShouldPersistTaps="handled">
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor={Colors.text.tertiary}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
              />
              <Text variant="caption" color="tertiary" style={styles.charCount}>
                {caption.length}/200
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRetake}
              >
                <Ionicons name="camera-outline" size={24} color={Colors.white} />
                <Text variant="body" color="white" style={styles.actionText}>
                  Retake
                </Text>
              </TouchableOpacity>

              <Button
                onPress={handlePost}
                variant="primary"
                size="large"
                fullWidth
                gradient
                loading={isPosting}
                style={styles.postButton}
              >
                Post to Memories
              </Button>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
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
  image: {
    flex: 1,
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.xl,
  },
  bottomContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  captionContainer: {
    marginBottom: Spacing.lg,
  },
  captionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.white,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.xs,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
  },
  actions: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  actionText: {
    fontSize: 16,
  },
  postButton: {
    marginTop: Spacing.sm,
  },
  button: {
    marginTop: Spacing.xl,
  },
});

