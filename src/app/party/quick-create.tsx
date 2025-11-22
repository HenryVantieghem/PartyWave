import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTime } from '@/lib/utils';
import { VibeTag } from '@/types/party';

const { width } = Dimensions.get('window');

const VIBE_TAGS: { tag: VibeTag; emoji: string; color: string }[] = [
  { tag: 'lit', emoji: '🔥', color: Colors.primary },
  { tag: 'chill', emoji: '😌', color: Colors.accent.blue },
  { tag: 'wild', emoji: '🎉', color: Colors.accent.purple },
  { tag: 'intimate', emoji: '💫', color: Colors.secondary },
  { tag: 'classy', emoji: '🥂', color: Colors.accent.gold },
  { tag: 'casual', emoji: '👋', color: Colors.accent.green },
];

export default function QuickCreatePartyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createQuickParty, isLoading } = usePartyStore();
  const { profile } = useAuthStore();

  // Smart defaults for quick creation, with camera integration
  const [coverPhoto, setCoverPhoto] = useState<string | null>(
    (params.photoUri as string) || null
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | undefined>(
    (params.imageUrl as string) || undefined
  );
  const [name, setName] = useState((params.name as string) || '');
  const [locationName, setLocationName] = useState((params.location as string) || '');
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    // Default to 2 hours from now
    now.setHours(now.getHours() + 2);
    now.setMinutes(0);
    return now;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedVibes, setSelectedVibes] = useState<VibeTag[]>(() => {
    // Parse vibes from params if available
    if (params.vibes) {
      const vibesStr = typeof params.vibes === 'string' ? params.vibes : params.vibes[0];
      return vibesStr.split(',').filter(Boolean) as VibeTag[];
    }
    return [(params.vibe as VibeTag) || 'lit'];
  });
  const [energyLevel, setEnergyLevel] = useState(75);

  // Update cover photo when returning from camera
  React.useEffect(() => {
    if (params.photoUri) {
      setCoverPhoto(params.photoUri as string);
    }
    if (params.imageUrl) {
      setCoverPhotoUrl(params.imageUrl as string);
    }
    if (params.vibes) {
      const vibesStr = typeof params.vibes === 'string' ? params.vibes : params.vibes[0];
      setSelectedVibes(vibesStr.split(',').filter(Boolean) as VibeTag[]);
    }
  }, [params.photoUri, params.imageUrl, params.vibes]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTakePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to camera screen with selected vibes
    router.push({
      pathname: '/party/camera',
      params: {
        vibes: selectedVibes.join(','),
      },
    });
  };

  const toggleVibe = (vibe: VibeTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVibes((prev) => {
      if (prev.includes(vibe)) {
        return prev.filter((v) => v !== vibe);
      } else {
        return [...prev, vibe];
      }
    });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setDateTime(selectedTime);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
  };

  const handleQuickCreate = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Party Name Required', 'Give your party a name!');
      return;
    }

    if (!locationName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Location Required', 'Where is this party at?');
      return;
    }

    if (!profile?.id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Use uploaded URL if available, otherwise upload now
      let finalCoverPhotoUrl: string | undefined = coverPhotoUrl;

      // Upload cover photo if we have local URI but no URL yet
      if (coverPhoto && !finalCoverPhotoUrl) {
        try {
          const { supabase } = await import('@/lib/supabase');
          const fileName = `${profile.id}/${Date.now()}.jpg`;

          const response = await fetch(coverPhoto);
          const blob = await response.blob();

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('party-covers')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from('party-covers').getPublicUrl(fileName);

          finalCoverPhotoUrl = publicUrl;
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          // Continue without cover photo if upload fails
        }
      }

      const party = await createQuickParty({
        name: name.trim(),
        date_time: dateTime.toISOString(),
        location_name: locationName.trim(),
        description: `Quick party at ${locationName.trim()}`,
        cover_photo_url: finalCoverPhotoUrl,
        vibe_tags: selectedVibes,
        energy_level: energyLevel,
        quick_create_metadata: {
          captured_at: new Date().toISOString(),
          source: coverPhoto ? 'camera' : 'manual',
          mood: selectedVibes[0] as 'lit' | 'chill' | 'hype',
        },
      });

      if (party) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/party/${party.id}`);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Quick create error:', error);
      Alert.alert('Failed to Create Party', error.message || 'Please try again');
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
            <View style={styles.headerCenter}>
              <Text variant="h3" weight="bold">
                Quick Party
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Create in under 15 seconds ⚡
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </BlurView>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Cover Photo (Optional) */}
        {coverPhoto ? (
          <View style={styles.coverContainer}>
            <Image source={{ uri: coverPhoto }} style={styles.coverImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.coverOverlay}
            />
            <TouchableOpacity onPress={handleTakePhoto} style={styles.retakeButton}>
              <BlurView intensity={80} tint="dark" style={styles.retakeBlur}>
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text variant="caption" weight="semibold" color="white" style={{ marginLeft: 6 }}>
                  Retake
                </Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleTakePhoto} style={styles.cameraPrompt}>
            <LinearGradient colors={Gradients.party} style={styles.cameraGradient}>
              <Ionicons name="camera" size={32} color={Colors.white} />
              <Text variant="body" weight="semibold" color="white" style={{ marginTop: Spacing.sm }}>
                Add Photo (Optional)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Form */}
        <View style={styles.formContainer}>
          {/* Essential Fields */}
          <Card variant="liquid" style={styles.formCard}>
            <Input
              placeholder="Party Name"
              value={name}
              onChangeText={setName}
              leftIcon="sparkles"
              maxLength={50}
              autoFocus
            />
            <Input
              placeholder="Location"
              value={locationName}
              onChangeText={setLocationName}
              leftIcon="location"
              maxLength={100}
              style={{ marginTop: Spacing.sm }}
            />

            {/* Time Selector */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTimePicker(true);
              }}
              style={styles.timeRow}
            >
              <View style={styles.timeIcon}>
                <Ionicons name="time" size={18} color={Colors.secondary} />
              </View>
              <Text variant="body" weight="semibold">
                {formatTime(dateTime)}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </Card>

          {/* Vibe Selector */}
          <View style={styles.vibeSection}>
            <Text variant="h4" weight="bold" style={styles.vibeTitle}>
              Vibe
            </Text>
            <View style={styles.vibeGrid}>
              {VIBE_TAGS.map(({ tag, emoji, color }) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleVibe(tag)}
                  style={[
                    styles.vibeChip,
                    selectedVibes.includes(tag) && {
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
                    color={selectedVibes.includes(tag) ? 'white' : 'secondary'}
                    style={{ marginLeft: 6 }}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Energy Level */}
          <Card variant="liquid" style={styles.energyCard}>
            <View style={styles.energyHeader}>
              <Text variant="body" weight="semibold">
                Energy Level
              </Text>
              <View style={styles.energyBadge}>
                <Text variant="caption" weight="bold" color="white">
                  {energyLevel}
                </Text>
              </View>
            </View>
            <View style={styles.energyBar}>
              <View style={[styles.energyFill, { width: `${energyLevel}%` }]}>
                <LinearGradient
                  colors={Gradients.party}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
            <View style={styles.energyButtons}>
              {[25, 50, 75, 100].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEnergyLevel(level);
                  }}
                  style={[
                    styles.energyButton,
                    energyLevel === level && styles.energyButtonActive,
                  ]}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    color={energyLevel === level ? 'white' : 'secondary'}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['bottom']} style={styles.actionContainer}>
          <Button
            variant="primary"
            gradient
            onPress={handleQuickCreate}
            loading={isLoading}
            disabled={!name.trim() || !locationName.trim()}
          >
            <Ionicons name="rocket" size={20} color={Colors.white} />
            <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
              Create Party ⚡
            </Text>
          </Button>
        </SafeAreaView>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <View style={styles.pickerModal}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text variant="h4" weight="bold">
                When?
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={styles.pickerClose}
              >
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={dateTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              textColor={Colors.white}
              themeVariant="dark"
              style={styles.picker}
            />
          </View>
        </View>
      )}
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
    height: 66,
  },
  headerCenter: {
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  coverContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  retakeButton: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  retakeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cameraPrompt: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  cameraGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    padding: Spacing.base,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  timeIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  vibeSection: {
    marginBottom: Spacing.lg,
  },
  vibeTitle: {
    marginBottom: Spacing.md,
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
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border.default,
  },
  vibeEmoji: {
    fontSize: 16,
  },
  energyCard: {
    marginBottom: Spacing.xl,
  },
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  energyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
  },
  energyBar: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  energyFill: {
    height: '100%',
  },
  energyButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  energyButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.default,
  },
  energyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  pickerClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: 200,
  },
});
