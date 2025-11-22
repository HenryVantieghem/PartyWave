// ============================================
// CREW SETTINGS SCREEN
// ============================================
// Manage crew settings (owner/admin only)
// ============================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCrewStore } from '@/stores/crewStore';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import type { CrewType, CrewPrivacy } from '@/types/crew';
import * as Haptics from 'expo-haptics';

const CREW_TYPES: { value: CrewType; label: string; description: string }[] = [
  { value: 'inner', label: 'Inner Circle', description: '2-8 close friends' },
  { value: 'extended', label: 'Extended Crew', description: '8-20 friends' },
  { value: 'open', label: 'Open Crew', description: 'Unlimited members' },
];

const PRIVACY_SETTINGS: { value: CrewPrivacy; label: string; description: string }[] = [
  { value: 'private', label: 'Private', description: 'Invite-only, hidden from search' },
  { value: 'closed', label: 'Closed', description: 'Visible, request to join' },
  { value: 'public', label: 'Public', description: 'Anyone can join' },
];

const THEME_COLORS = [
  { color: '#FF6B6B', name: 'Coral' },
  { color: '#8B5CF6', name: 'Violet' },
  { color: '#06B6D4', name: 'Cyan' },
  { color: '#FBBF24', name: 'Gold' },
  { color: '#10B981', name: 'Green' },
  { color: '#F59E0B', name: 'Orange' },
  { color: '#EC4899', name: 'Pink' },
  { color: '#6366F1', name: 'Indigo' },
];

export default function CrewSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentCrew, crewMembers, loading, fetchCrew, updateCrew, deleteCrew } = useCrewStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [crewType, setCrewType] = useState<CrewType>('extended');
  const [privacy, setPrivacy] = useState<CrewPrivacy>('private');
  const [themeColor, setThemeColor] = useState('#8B5CF6');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCrew(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentCrew) {
      setName(currentCrew.name);
      setDescription(currentCrew.description || '');
      setCrewType(currentCrew.crew_type);
      setPrivacy(currentCrew.privacy_setting);
      setThemeColor(currentCrew.theme_color);
    }
  }, [currentCrew]);

  const userRole = crewMembers[id || '']?.find(m => m.user_id === user?.id)?.role;
  const canEdit = userRole === 'owner' || userRole === 'admin';

  if (!canEdit) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={64} color={Colors.text.secondary} />
          <Text style={styles.errorText}>Only admins can access settings</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!id || !name.trim()) {
      Alert.alert('Name Required', 'Please enter a crew name');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const success = await updateCrew(id, {
      name: name.trim(),
      description: description.trim() || undefined,
      crew_type: crewType,
      privacy_setting: privacy,
      theme_color: themeColor,
    });

    setSaving(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Crew',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const success = await deleteCrew(id);
            if (success) {
              router.replace('/(tabs)/crew');
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Crew Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Crew Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="The Squad"
            placeholderTextColor={Colors.text.tertiary}
            maxLength={50}
            style={styles.input}
          />
          <Text style={styles.hint}>{name.length}/50</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell people about your crew"
            placeholderTextColor={Colors.text.tertiary}
            multiline
            numberOfLines={3}
            maxLength={200}
            style={[styles.input, styles.textArea]}
          />
          <Text style={styles.hint}>{description.length}/200</Text>
        </View>

        {/* Crew Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Crew Type</Text>
          {CREW_TYPES.map((type) => (
            <Pressable
              key={type.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCrewType(type.value);
              }}
              style={({ pressed }) => [
                styles.option,
                crewType === type.value && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{type.label}</Text>
                <Text style={styles.optionDescription}>{type.description}</Text>
              </View>
              {crewType === type.value && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.label}>Privacy</Text>
          {PRIVACY_SETTINGS.map((setting) => (
            <Pressable
              key={setting.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPrivacy(setting.value);
              }}
              style={({ pressed }) => [
                styles.option,
                privacy === setting.value && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{setting.label}</Text>
                <Text style={styles.optionDescription}>{setting.description}</Text>
              </View>
              {privacy === setting.value && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Theme Color */}
        <View style={styles.section}>
          <Text style={styles.label}>Theme Color</Text>
          <View style={styles.colorGrid}>
            {THEME_COLORS.map(({ color }) => (
              <Pressable
                key={color}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setThemeColor(color);
                }}
                style={({ pressed }) => [
                  styles.colorOption,
                  { backgroundColor: color },
                  themeColor === color && styles.colorSelected,
                  pressed && styles.colorPressed,
                ]}
              >
                {themeColor === color && (
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        {userRole === 'owner' && (
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={styles.deleteButtonText}>Delete Crew</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!name.trim() || saving}
          style={({ pressed }) => [
            styles.saveButton,
            (!name.trim() || saving) && styles.saveButtonDisabled,
            pressed && styles.saveButtonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.sm,
  },
  optionSelected: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: Colors.primary,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: Colors.white,
  },
  colorPressed: {
    transform: [{ scale: 0.9 }],
  },
  dangerZone: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 59, 48, 0.2)',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
