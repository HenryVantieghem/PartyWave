import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { VibeTag } from '@/types/party';

const VIBE_TAGS: { tag: VibeTag; emoji: string }[] = [
  { tag: 'lit', emoji: '🔥' },
  { tag: 'chill', emoji: '😌' },
  { tag: 'wild', emoji: '🎉' },
  { tag: 'intimate', emoji: '💫' },
  { tag: 'classy', emoji: '🥂' },
  { tag: 'casual', emoji: '👋' },
  { tag: 'rave', emoji: '💃' },
  { tag: 'lounge', emoji: '🍸' },
];

const EMOJI_OPTIONS = ['🎉', '🎊', '🎈', '🎁', '🎂', '🍕', '🍺', '🎵', '🎮', '⚽', '🏀', '🎯', '🎪', '🎭', '🎨', '📚'];

export default function CreateTemplateScreen() {
  const router = useRouter();
  const { createTemplate, isLoading } = usePartyStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconEmoji, setIconEmoji] = useState('🎉');
  const [durationHours, setDurationHours] = useState('4');
  const [suggestedCapacity, setSuggestedCapacity] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<VibeTag[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [defaultPrivacy, setDefaultPrivacy] = useState<'public' | 'private'>('public');

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Required Field', 'Please enter a template name');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        icon_emoji: iconEmoji,
        default_duration_hours: parseInt(durationHours) || 4,
        suggested_capacity: suggestedCapacity ? parseInt(suggestedCapacity) : undefined,
        default_vibe_tags: selectedVibes,
        is_public: isPublic,
        default_privacy: defaultPrivacy,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to create template');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text variant="h3" weight="bold">
              New Template
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </BlurView>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Template Details */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Template Details
            </Text>
            <Card variant="liquid">
              <Input
                placeholder="Template Name"
                value={name}
                onChangeText={setName}
                leftIcon="document-text"
                maxLength={50}
                autoFocus
              />
              <Input
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                leftIcon="text"
                multiline
                numberOfLines={2}
                maxLength={150}
                style={styles.descriptionInput}
              />
            </Card>
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Icon
            </Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIconEmoji(emoji);
                  }}
                  style={[
                    styles.emojiOption,
                    iconEmoji === emoji && styles.emojiOptionActive,
                  ]}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vibe Tags */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Default Vibes
            </Text>
            <View style={styles.vibeGrid}>
              {VIBE_TAGS.map(({ tag, emoji }) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedVibes((prev) =>
                      prev.includes(tag) ? prev.filter((v) => v !== tag) : [...prev, tag]
                    );
                  }}
                  style={[
                    styles.vibeChip,
                    selectedVibes.includes(tag) && styles.vibeChipActive,
                  ]}
                >
                  <Text style={styles.vibeEmoji}>{emoji}</Text>
                  <Text
                    variant="caption"
                    weight="semibold"
                    color={selectedVibes.includes(tag) ? 'white' : 'secondary'}
                    style={{ marginLeft: 6 }}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Default Settings
            </Text>
            <Card variant="liquid">
              <Input
                placeholder="Duration (hours)"
                value={durationHours}
                onChangeText={setDurationHours}
                leftIcon="time"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Input
                placeholder="Suggested Capacity (optional)"
                value={suggestedCapacity}
                onChangeText={setSuggestedCapacity}
                leftIcon="people"
                keyboardType="number-pad"
                maxLength={4}
              />

              <View style={styles.divider} />

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDefaultPrivacy(defaultPrivacy === 'public' ? 'private' : 'public');
                }}
                style={styles.settingRow}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons
                      name={defaultPrivacy === 'private' ? 'lock-closed' : 'lock-open'}
                      size={20}
                      color={defaultPrivacy === 'private' ? Colors.accent.purple : Colors.accent.green}
                    />
                  </View>
                  <View>
                    <Text variant="body" weight="semibold">
                      Default Privacy
                    </Text>
                    <Text variant="caption" color="secondary">
                      {defaultPrivacy === 'private' ? 'Parties are private by default' : 'Parties are public by default'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.toggle, defaultPrivacy === 'private' && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, defaultPrivacy === 'private' && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsPublic(!isPublic);
                }}
                style={styles.settingRow}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons name="globe" size={20} color={Colors.accent.blue} />
                  </View>
                  <View>
                    <Text variant="body" weight="semibold">
                      Public Template
                    </Text>
                    <Text variant="caption" color="secondary">
                      Others can use this template
                    </Text>
                  </View>
                </View>
                <View style={[styles.toggle, isPublic && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </Card>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['bottom']} style={styles.actionContainer}>
          <Button
            variant="primary"
            gradient
            onPress={handleCreate}
            loading={isLoading}
            disabled={!name.trim()}
          >
            <Ionicons name="checkmark" size={20} color={Colors.white} />
            <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
              Create Template
            </Text>
          </Button>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  descriptionInput: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emoji: {
    fontSize: 28,
  },
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  vibeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vibeEmoji: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.dark,
    marginVertical: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
  actionContainer: {
    padding: Spacing.base,
  },
});
