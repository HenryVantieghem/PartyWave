import React, { useState, useEffect } from 'react';
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
import { Card } from '@/components/ui/Card';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, Layout, BorderRadius, Shadows } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { useCrewStore } from '@/stores/crewStore';
import { formatDate, formatTime, generateInviteCode } from '@/lib/utils';
import { VibeTag } from '@/types/party';
import { CrewMember } from '@/types/crew';

const VIBE_TAGS: { tag: VibeTag; emoji: string; color: string }[] = [
  { tag: 'lit', emoji: '🔥', color: Colors.primary },
  { tag: 'chill', emoji: '😌', color: Colors.accent.blue },
  { tag: 'wild', emoji: '🎉', color: Colors.accent.purple },
  { tag: 'intimate', emoji: '💫', color: Colors.secondary },
  { tag: 'classy', emoji: '🥂', color: Colors.accent.gold },
  { tag: 'casual', emoji: '👋', color: Colors.accent.green },
  { tag: 'rave', emoji: '💃', color: Colors.accent.neon },
  { tag: 'lounge', emoji: '🍸', color: Colors.accent.orange },
];

export default function CreatePartyScreen() {
  const router = useRouter();
  const { createPlannedParty, isLoading } = usePartyStore();
  const { profile } = useAuthStore();
  const { myCrews, fetchMyCrews, crewMembers, fetchCrewMembers } = useCrewStore();

  // Mode selector - Quick vs Planned
  const [showModeSelector, setShowModeSelector] = useState(true);

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

  // Phase 2 fields
  const [selectedVibes, setSelectedVibes] = useState<VibeTag[]>([]);
  const [energyLevel, setEnergyLevel] = useState(75);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [rsvpDeadline, setRsvpDeadline] = useState<Date | null>(null);
  const [showRsvpPicker, setShowRsvpPicker] = useState(false);
  const [selectedCoHosts, setSelectedCoHosts] = useState<string[]>([]);

  useEffect(() => {
    fetchMyCrews();
  }, []);

  // Fetch crew members when crew is selected
  useEffect(() => {
    if (selectedCrewId) {
      fetchCrewMembers(selectedCrewId);
    }
  }, [selectedCrewId]);

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
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(dateTime.getHours());
      newDateTime.setMinutes(dateTime.getMinutes());
      setDateTime(newDateTime);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDateTime = new Date(dateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setDateTime(newDateTime);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Required Field', 'Please enter a party name');
      return;
    }

    if (!locationName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Required Field', 'Please enter a location');
      return;
    }

    if (!profile?.id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'You must be logged in to create a party');
      return;
    }

    // Validate date is in the future
    if (dateTime <= new Date()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Date', 'Party date must be in the future');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      let coverImageUrl: string | undefined = undefined;

      // Upload cover image if provided
      if (coverImage) {
        try {
          const { supabase } = await import('@/lib/supabase');
          const fileName = `${profile.id}/${Date.now()}.jpg`;
          
          // Convert URI to blob
          const response = await fetch(coverImage);
          const blob = await response.blob();

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('party-covers')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('party-covers')
            .getPublicUrl(fileName);

          coverImageUrl = publicUrl;
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          // Continue without cover image if upload fails
        }
      }

      const party = await createPlannedParty({
        name: name.trim(),
        description: description.trim(),
        date_time: dateTime.toISOString(),
        location_name: locationName.trim(),
        location_address: locationAddress.trim() || undefined,
        cover_photo_url: coverImageUrl,
        vibe_tags: selectedVibes,
        energy_level: energyLevel,
        capacity: maxAttendees ? parseInt(maxAttendees) : undefined,
        rsvp_deadline: rsvpDeadline?.toISOString(),
        crew_id: selectedCrewId || undefined,
        is_private: isPrivate,
        co_host_ids: selectedCoHosts.length > 0 ? selectedCoHosts : undefined,
      });

      if (!party) {
        throw new Error('Failed to create party');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate immediately to the party detail page
      router.replace(`/party/${party.id}`);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Create party error:', error);

      // Show error alert with better messaging
      Alert.alert(
        'Failed to Create Party',
        error.message || 'Something went wrong. Please check your connection and try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Mode Selector Modal */}
      {showModeSelector && (
        <View style={styles.modeSelectorOverlay}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <SafeAreaView style={styles.modeSelectorContainer}>
            <View style={styles.modeSelectorContent}>
              <Text variant="h2" weight="bold" center style={{ marginBottom: Spacing.sm }}>
                Create Party
              </Text>
              <Text variant="body" color="secondary" center style={{ marginBottom: Spacing['2xl'] }}>
                Choose your creation mode
              </Text>

              {/* Quick Create Option */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.replace('/party/quick-create');
                }}
                style={styles.modeOption}
                activeOpacity={0.8}
              >
                <LinearGradient colors={Gradients.party} style={styles.modeGradient}>
                  <View style={styles.modeIcon}>
                    <Ionicons name="flash" size={32} color={Colors.white} />
                  </View>
                  <View style={styles.modeInfo}>
                    <Text variant="h3" weight="bold" color="white">
                      Quick Create
                    </Text>
                    <Text variant="body" color="white" style={{ opacity: 0.9, marginTop: 4 }}>
                      Party ready in under 15 seconds
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Planned Party Option */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowModeSelector(false);
                }}
                style={styles.modeOption}
                activeOpacity={0.8}
              >
                <Card variant="liquid" style={styles.modeCard}>
                  <View style={styles.modeIcon}>
                    <LinearGradient colors={Gradients.party} style={styles.modeIconGradient}>
                      <Ionicons name="calendar" size={28} color={Colors.white} />
                    </LinearGradient>
                  </View>
                  <View style={styles.modeInfo}>
                    <Text variant="h3" weight="bold">
                      Planned Party
                    </Text>
                    <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
                      Full wizard with all features
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.text.tertiary} />
                </Card>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                onPress={handleBack}
                style={styles.modeSelectorClose}
              >
                <Text variant="body" color="secondary">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

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
            <Card variant="liquid">
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
            </Card>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Date & Time
            </Text>
            <Card variant="liquid">
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
            </Card>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Location
            </Text>
            <Card variant="liquid">
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
            </Card>
          </View>

          {/* Vibe Tags */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Party Vibe
            </Text>
            <View style={styles.vibeGrid}>
              {VIBE_TAGS.map(({ tag, emoji, color }) => (
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
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Energy Level
            </Text>
            <Card variant="liquid">
              <View style={styles.energyHeader}>
                <Text variant="body" weight="semibold">
                  Expected Energy
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

          {/* Crew Selection */}
          {myCrews.length > 0 && (
            <View style={styles.section}>
              <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                Party Crew (Optional)
              </Text>
              <Card variant="liquid">
                <Text variant="caption" color="secondary" style={{ marginBottom: Spacing.md }}>
                  Link this party to a crew
                </Text>
                {myCrews.map((crew) => (
                  <TouchableOpacity
                    key={crew.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCrewId(selectedCrewId === crew.id ? null : crew.id);
                    }}
                    style={[
                      styles.crewOption,
                      selectedCrewId === crew.id && styles.crewOptionActive,
                    ]}
                  >
                    <View style={styles.crewInfo}>
                      <Text variant="body" weight="semibold">
                        {crew.name}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {crew.member_count} members
                      </Text>
                    </View>
                    {selectedCrewId === crew.id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          )}

          {/* Co-Hosts Selection */}
          {selectedCrewId && crewMembers[selectedCrewId] && crewMembers[selectedCrewId].length > 1 && (
            <View style={styles.section}>
              <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                Co-Hosts (Optional)
              </Text>
              <Card variant="liquid">
                <Text variant="caption" color="secondary" style={{ marginBottom: Spacing.md }}>
                  Give crew members host permissions
                </Text>
                {crewMembers[selectedCrewId]
                  .filter((member: CrewMember) => member.user_id !== profile?.id)
                  .map((member: CrewMember) => (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCoHosts((prev) =>
                          prev.includes(member.user_id)
                            ? prev.filter((id) => id !== member.user_id)
                            : [...prev, member.user_id]
                        );
                      }}
                      style={[
                        styles.coHostOption,
                        selectedCoHosts.includes(member.user_id) && styles.coHostOptionActive,
                      ]}
                    >
                      <View style={styles.coHostInfo}>
                        <View style={styles.coHostAvatar}>
                          {member.user?.avatar_url ? (
                            <Image
                              source={{ uri: member.user.avatar_url }}
                              style={styles.coHostAvatarImage}
                            />
                          ) : (
                            <View style={styles.coHostAvatarPlaceholder}>
                              <Text variant="h4" weight="bold" color="white">
                                {(member.user?.full_name || member.user?.username)?.charAt(0).toUpperCase() || '?'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="body" weight="semibold">
                            {member.user?.full_name || member.user?.username || 'Unknown'}
                          </Text>
                          <Text variant="caption" color="secondary">
                            {member.role === 'admin' ? 'Crew Admin' : 'Crew Member'}
                          </Text>
                        </View>
                      </View>
                      {selectedCoHosts.includes(member.user_id) && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                {selectedCoHosts.length > 0 && (
                  <View style={styles.coHostSummary}>
                    <Ionicons name="people" size={16} color={Colors.accent.blue} />
                    <Text variant="caption" color="secondary" style={{ marginLeft: Spacing.xs }}>
                      {selectedCoHosts.length} co-host{selectedCoHosts.length > 1 ? 's' : ''} selected
                    </Text>
                  </View>
                )}
              </Card>
            </View>
          )}

          {/* Party Settings */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Settings
            </Text>
            <Card variant="liquid">
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
                  setShowRsvpPicker(true);
                }}
                style={styles.dateTimeButton}
              >
                <View style={styles.dateTimeIcon}>
                  <Ionicons name="time-outline" size={20} color={Colors.accent.orange} />
                </View>
                <View style={styles.dateTimeText}>
                  <Text variant="caption" color="secondary">
                    RSVP Deadline (Optional)
                  </Text>
                  <Text variant="body" weight="semibold">
                    {rsvpDeadline ? formatDate(rsvpDeadline) : 'No deadline'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>

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
            </Card>
          </View>

          {/* Info Card */}
          <Card variant="liquid" style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={20} color={Colors.accent.blue} />
              <Text variant="caption" color="secondary" style={styles.infoText}>
                Your party will be visible to everyone nearby. You can edit or cancel it anytime.
              </Text>
            </View>
          </Card>

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

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.pickerModal}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text variant="h4" weight="bold">
                Select Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.pickerClose}
              >
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={dateTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              textColor={Colors.white}
              themeVariant="dark"
              style={styles.picker}
            />
          </View>
        </View>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <View style={styles.pickerModal}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text variant="h4" weight="bold">
                Select Time
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

      {/* RSVP Deadline Picker Modal */}
      {showRsvpPicker && (
        <View style={styles.pickerModal}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text variant="h4" weight="bold">
                RSVP Deadline
              </Text>
              <TouchableOpacity
                onPress={() => setShowRsvpPicker(false)}
                style={styles.pickerClose}
              >
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={rsvpDeadline || new Date()}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selected) => {
                if (Platform.OS === 'android') {
                  setShowRsvpPicker(false);
                }
                if (selected) {
                  setRsvpDeadline(selected);
                  if (Platform.OS === 'ios') {
                    setShowRsvpPicker(false);
                  }
                }
              }}
              minimumDate={new Date()}
              maximumDate={dateTime}
              textColor={Colors.white}
              themeVariant="dark"
              style={styles.picker}
            />
            {rsvpDeadline && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRsvpDeadline(null);
                  setShowRsvpPicker(false);
                }}
                style={styles.clearButton}
              >
                <Text variant="body" color="secondary">
                  Clear Deadline
                </Text>
              </TouchableOpacity>
            )}
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

  // Mode Selector
  modeSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modeSelectorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modeSelectorContent: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  modeOption: {
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  modeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modeIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  modeIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeSelectorClose: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Phase 2: Vibe Tags
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
  vibeEmoji: {
    fontSize: 16,
  },

  // Phase 2: Energy Level
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  energyBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  energyBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  energyFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  energyButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  energyButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  energyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Phase 2: Crew Selection
  crewOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  crewOptionActive: {
    backgroundColor: 'rgba(255, 94, 120, 0.1)',
    borderColor: Colors.primary,
  },
  crewInfo: {
    flex: 1,
  },

  // Phase 2: RSVP Deadline
  clearButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },

  // Phase 2: Co-Hosts
  coHostOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coHostOptionActive: {
    backgroundColor: 'rgba(255, 94, 120, 0.1)',
    borderColor: Colors.primary,
  },
  coHostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  coHostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  coHostAvatarImage: {
    width: '100%',
    height: '100%',
  },
  coHostAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coHostSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
});
