import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { VibeTag } from '@/types/party';

const { width } = Dimensions.get('window');

const VIBE_TAGS: { tag: VibeTag; emoji: string; color: string }[] = [
  { tag: 'lit', emoji: '🔥', color: Colors.primary },
  { tag: 'chill', emoji: '😌', color: Colors.accent.blue },
  { tag: 'wild', emoji: '🎉', color: Colors.accent.purple },
];

export default function PartyPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.uri as string;

  // Quick form state
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<VibeTag>('lit');

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreateParty = () => {
    if (!name.trim() || !locationName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Navigate to quick-create with photo and initial data
    router.replace({
      pathname: '/party/quick-create' as any,
      params: {
        photoUri: imageUri,
        name: name.trim(),
        location: locationName.trim(),
        vibe: selectedVibe,
      },
    });
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
      {/* Background Image */}
      <Image source={{ uri: imageUri }} style={styles.backgroundImage} blurRadius={10} />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleRetake}>
              <Ionicons name="camera-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.topCenter}>
              <Text variant="h4" weight="bold" color="white">
                Quick Party Setup
              </Text>
              <Text variant="caption" color="white" style={{ opacity: 0.8, marginTop: 2 }}>
                Photo captured ✓
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Preview Card */}
          <View style={styles.previewCard}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.previewOverlay}
            >
              <View style={styles.previewBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.accent.green} />
                <Text variant="caption" weight="bold" color="white" style={{ marginLeft: 4 }}>
                  Ready for party
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Form */}
          <View style={styles.formContainer}>
            <Card variant="liquid" style={styles.formCard}>
              <Input
                placeholder="Party Name"
                value={name}
                onChangeText={setName}
                leftIcon="sparkles"
                maxLength={50}
                autoFocus
                style={styles.input}
              />
              <Input
                placeholder="Location"
                value={locationName}
                onChangeText={setLocationName}
                leftIcon="location"
                maxLength={100}
                style={[styles.input, { marginTop: Spacing.sm }]}
              />
            </Card>

            {/* Vibe Quick Selector */}
            <View style={styles.vibeSection}>
              <Text variant="body" weight="semibold" color="white" style={styles.vibeLabel}>
                Pick a vibe
              </Text>
              <View style={styles.vibeGrid}>
                {VIBE_TAGS.map(({ tag, emoji, color }) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedVibe(tag);
                    }}
                    style={[
                      styles.vibeChip,
                      selectedVibe === tag && {
                        backgroundColor: color,
                        borderColor: color,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.vibeEmoji}>{emoji}</Text>
                    <Text
                      variant="caption"
                      weight="semibold"
                      color={selectedVibe === tag ? 'white' : 'secondary'}
                      style={{ marginLeft: 6 }}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Create Button */}
          <View style={styles.bottomContainer}>
            <Button
              variant="primary"
              gradient
              onPress={handleCreateParty}
              disabled={!name.trim() || !locationName.trim()}
              size="large"
              fullWidth
            >
              <Ionicons name="rocket" size={20} color={Colors.white} />
              <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                Create Party ⚡
              </Text>
            </Button>
            <Text variant="caption" center color="white" style={{ marginTop: Spacing.sm, opacity: 0.7 }}>
              Complete in 3 more taps
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  topCenter: {
    alignItems: 'center',
    flex: 1,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewCard: {
    width: width - Spacing.lg * 2,
    height: 200,
    alignSelf: 'center',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  input: {
    fontSize: 16,
  },
  vibeSection: {
    marginBottom: Spacing.xl,
  },
  vibeLabel: {
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  vibeGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  vibeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  vibeEmoji: {
    fontSize: 18,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.xl,
  },
});
