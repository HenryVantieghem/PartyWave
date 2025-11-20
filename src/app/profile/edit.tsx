import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { uploadFileFromUri, getPublicUrl } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    username?: string;
  }>({});

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
      isValid = false;
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!profile?.id) return;

    try {
      setIsLoading(true);

      let avatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (avatarUri) {
        const timestamp = Date.now();
        const filename = `${profile.id}/${timestamp}.jpg`;
        await uploadFileFromUri('avatars', filename, avatarUri, 'image/jpeg');
        avatarUrl = getPublicUrl('avatars', filename);
      }

      // Update profile
      await updateProfile({
        display_name: displayName.trim(),
        username: username.trim(),
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        avatar_url: avatarUrl,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your profile has been updated!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatarUrl = avatarUri || profile?.avatar_url;

  return (
    <LinearGradient
      colors={[Colors.black, Colors.backgroundElevated]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text variant="h4" weight="bold">
            Edit Profile
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {currentAvatarUrl ? (
                <Image source={{ uri: currentAvatarUrl }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.avatarPlaceholder}
                >
                  <Text variant="h1" style={styles.avatarInitial}>
                    {displayName.charAt(0).toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              )}
              <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.editAvatarGradient}
                >
                  <Ionicons name="camera" size={20} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text variant="body" color="secondary" center style={styles.avatarHint}>
              Tap to change profile photo
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Display Name"
              placeholder="Your full name"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (errors.displayName) setErrors({ ...errors, displayName: undefined });
              }}
              leftIcon="person-outline"
              error={errors.displayName}
            />

            <Input
              label="Username"
              placeholder="username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) setErrors({ ...errors, username: undefined });
              }}
              leftIcon="at"
              autoCapitalize="none"
              error={errors.username}
            />

            <Input
              label="Bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChangeText={setBio}
              leftIcon="create-outline"
              multiline
              maxLength={160}
            />
            <Text variant="caption" color="tertiary" style={styles.charCount}>
              {bio.length}/160
            </Text>

            <Input
              label="Location"
              placeholder="City, Country"
              value={location}
              onChangeText={setLocation}
              leftIcon="location-outline"
            />
          </View>

          {/* Stats Info */}
          <View style={styles.statsInfo}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text variant="caption" color="secondary" style={styles.infoText}>
                Your party stats (hosted, attended, friends) are calculated automatically and cannot be edited.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            onPress={handleSave}
            variant="primary"
            size="large"
            fullWidth
            gradient
            loading={isLoading}
          >
            Save Changes
          </Button>
          <Button
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            variant="ghost"
            size="large"
            fullWidth
          >
            Cancel
          </Button>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: 48,
    color: Colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 18,
    overflow: 'hidden',
  },
  editAvatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  avatarHint: {
    fontSize: 13,
  },
  form: {
    gap: Spacing.lg,
  },
  charCount: {
    textAlign: 'right',
    marginTop: -Spacing.sm,
    fontSize: 11,
  },
  statsInfo: {
    marginTop: Spacing['2xl'],
  },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  bottomActions: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
});
