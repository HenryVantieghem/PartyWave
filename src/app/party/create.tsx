import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, Layout, BorderRadius, Shadows } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatTime } from '@/lib/utils';

export default function CreatePartyScreen() {
  const router = useRouter();
  const { createParty, isLoading } = usePartyStore();
  const { profile } = useAuthStore();

  // Form state
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateTime(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setDateTime(selectedTime);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a party name');
      return;
    }

    if (!locationName.trim()) {
      Alert.alert('Required Field', 'Please enter a location');
      return;
    }

    if (!profile?.id) {
      Alert.alert('Error', 'You must be logged in to create a party');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const party = await createParty({
        host_id: profile.id,
        name: name.trim(),
        description: description.trim() || undefined,
        date_time: dateTime.toISOString(),
        location_name: locationName.trim(),
        location_address: locationAddress.trim() || undefined,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        is_private: isPrivate,
        status: 'upcoming',
      });

      Alert.alert('Success', '🎉 Your party has been created!', [
        {
          text: 'View Party',
          onPress: () => router.replace(`/party/${party.id}`),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create party');
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
              Create Party
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
          {/* Cover Image */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Cover Photo
            </Text>
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.coverImageContainer}
              activeOpacity={0.8}
            >
              {coverImage ? (
                <>
                  <Image source={{ uri: coverImage }} style={styles.coverImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)']}
                    style={styles.coverOverlay}
                  >
                    <View style={styles.changePhotoButton}>
                      <Ionicons name="camera" size={20} color={Colors.white} />
                      <Text variant="caption" weight="semibold" color="white" style={{ marginLeft: Spacing.xs }}>
                        Change Photo
                      </Text>
                    </View>
                  </LinearGradient>
                </>
              ) : (
                <View style={styles.coverPlaceholder}>
                  <LinearGradient colors={Gradients.party} style={StyleSheet.absoluteFill} />
                  <View style={styles.placeholderContent}>
                    <Ionicons name="images" size={48} color={Colors.white} />
                    <Text variant="h4" weight="bold" color="white" style={{ marginTop: Spacing.sm }}>
                      Add Cover Photo
                    </Text>
                    <Text variant="caption" color="white" style={{ marginTop: Spacing.xs, opacity: 0.8 }}>
                      Tap to select from gallery
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakePhoto} style={styles.takePhotoButton}>
              <Ionicons name="camera" size={18} color={Colors.primary} />
              <Text variant="body" weight="semibold" color="primary" style={{ marginLeft: Spacing.xs }}>
                Take Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Party Details */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Party Details
            </Text>
            <View style={styles.glassCard}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.cardContent}>
                <Input
                  placeholder="Party Name"
                  value={name}
                  onChangeText={setName}
                  leftIcon="sparkles"
                  maxLength={50}
                />
                <Input
                  placeholder="Description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  leftIcon="text"
                  multiline
                  numberOfLines={3}
                  style={styles.descriptionInput}
                  maxLength={200}
                />
              </View>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Date & Time
            </Text>
            <View style={styles.glassCard}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.cardContent}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(true);
                  }}
                  style={styles.dateTimeButton}
                >
                  <View style={styles.dateTimeIcon}>
                    <Ionicons name="calendar" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.dateTimeText}>
                    <Text variant="caption" color="secondary">
                      Date
                    </Text>
                    <Text variant="body" weight="semibold">
                      {formatDate(dateTime)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowTimePicker(true);
                  }}
                  style={styles.dateTimeButton}
                >
                  <View style={styles.dateTimeIcon}>
                    <Ionicons name="time" size={20} color={Colors.secondary} />
                  </View>
                  <View style={styles.dateTimeText}>
                    <Text variant="caption" color="secondary">
                      Time
                    </Text>
                    <Text variant="body" weight="semibold">
                      {formatTime(dateTime)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Location
            </Text>
            <View style={styles.glassCard}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.cardContent}>
                <Input
                  placeholder="Location Name"
                  value={locationName}
                  onChangeText={setLocationName}
                  leftIcon="location"
                  maxLength={100}
                />
                <Input
                  placeholder="Full Address (optional)"
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                  leftIcon="map"
                  maxLength={200}
                />
              </View>
            </View>
          </View>

          {/* Party Settings */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Settings
            </Text>
            <View style={styles.glassCard}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.cardContent}>
                <Input
                  placeholder="Max Attendees (optional)"
                  value={maxAttendees}
                  onChangeText={setMaxAttendees}
                  leftIcon="people"
                  keyboardType="number-pad"
                  maxLength={4}
                />

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsPrivate(!isPrivate);
                  }}
                  style={styles.settingRow}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Ionicons name="lock-closed" size={20} color={Colors.accent.purple} />
                    </View>
                    <View>
                      <Text variant="body" weight="semibold">
                        Private Party
                      </Text>
                      <Text variant="caption" color="secondary">
                        Invite only, requires code to join
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.toggle,
                      isPrivate && styles.toggleActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        isPrivate && styles.toggleThumbActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={20} color={Colors.accent.blue} />
              <Text variant="caption" color="secondary" style={styles.infoText}>
                Your party will be visible to everyone nearby. You can edit or cancel it anytime.
              </Text>
            </View>
          </View>

          {/* Bottom spacing */}
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
            disabled={!name.trim() || !locationName.trim()}
          >
            <Ionicons name="rocket" size={20} color={Colors.white} />
            <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
              Create Party 🎉
            </Text>
          </Button>
        </SafeAreaView>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dateTime}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          minimumDate={new Date()}
          textColor={Colors.white}
          themeVariant="dark"
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={dateTime}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          textColor={Colors.white}
          themeVariant="dark"
        />
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
  coverImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadows.md,
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
    justifyContent: 'flex-end',
    padding: Spacing.base,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.md,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  takePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  glassCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Shadows.sm,
  },
  cardContent: {
    padding: Spacing.base,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dateTimeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dateTimeText: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.dark,
    marginVertical: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
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
  infoCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.dark,
    marginTop: Spacing.base,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
    lineHeight: 18,
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
