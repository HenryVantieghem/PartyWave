import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

interface NotificationPreferences {
  party_invites: boolean;
  crew_invites: boolean;
  party_reminders: boolean;
  crew_activity: boolean;
  messages: boolean;
  vouches: boolean;
  party_updates: boolean;
  friend_requests: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    party_invites: true,
    crew_invites: true,
    party_reminders: true,
    crew_activity: true,
    messages: true,
    vouches: true,
    party_updates: true,
    friend_requests: true,
  });

  useEffect(() => {
    checkPushPermissions();
    loadPreferences();
  }, []);

  const checkPushPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPushEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking push permissions:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          party_invites: data.party_invites ?? true,
          crew_invites: data.crew_invites ?? true,
          party_reminders: data.party_reminders ?? true,
          crew_activity: data.crew_activity ?? true,
          messages: data.messages ?? true,
          vouches: data.vouches ?? true,
          party_updates: data.party_updates ?? true,
          friend_requests: data.friend_requests ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPreferences: NotificationPreferences) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: profile?.id,
          ...updatedPreferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
  };

  const handleEnablePush = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
          [{ text: 'OK' }]
        );
        return;
      }

      setPushEnabled(true);

      // Get push token and save to database
      const token = await Notifications.getExpoPushTokenAsync();

      await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: profile?.id,
          push_token: token.data,
          platform: 'expo',
          updated_at: new Date().toISOString(),
        });

      Alert.alert('Success', 'Push notifications enabled!');
    } catch (error) {
      console.error('Error enabling push:', error);
      Alert.alert('Error', 'Failed to enable push notifications');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text variant="h3" weight="bold">
              Notification Settings
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </BlurView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text variant="body" color="secondary" style={{ marginTop: Spacing.md }}>
            Loading preferences...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Push Notifications */}
          {!pushEnabled && (
            <Card variant="liquid" style={{ marginBottom: Spacing.lg }}>
              <View style={styles.pushPrompt}>
                <View style={styles.pushIcon}>
                  <Ionicons name="notifications-off" size={48} color={Colors.accent.orange} />
                </View>
                <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
                  Enable Push Notifications
                </Text>
                <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                  Get instant updates about parties, invites, and crew activity
                </Text>
                <TouchableOpacity onPress={handleEnablePush} style={styles.enableButton}>
                  <Text variant="button" weight="bold" color="white">
                    Enable Notifications
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Party Notifications */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Party Notifications
            </Text>
            <Card variant="liquid">
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="calendar" size={24} color={Colors.primary} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Party Invites
                    </Text>
                    <Text variant="caption" color="secondary">
                      When someone invites you to a party
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.party_invites}
                  onValueChange={(value) => handleToggle('party_invites', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="time" size={24} color={Colors.accent.orange} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Party Reminders
                    </Text>
                    <Text variant="caption" color="secondary">
                      Reminders before parties start
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.party_reminders}
                  onValueChange={(value) => handleToggle('party_reminders', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="alert-circle" size={24} color={Colors.accent.gold} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Party Updates
                    </Text>
                    <Text variant="caption" color="secondary">
                      Changes to parties you're attending
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.party_updates}
                  onValueChange={(value) => handleToggle('party_updates', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </Card>
          </View>

          {/* Crew Notifications */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Crew Notifications
            </Text>
            <Card variant="liquid">
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="people" size={24} color={Colors.accent.blue} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Crew Invites
                    </Text>
                    <Text variant="caption" color="secondary">
                      When someone invites you to a crew
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.crew_invites}
                  onValueChange={(value) => handleToggle('crew_invites', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="flash" size={24} color={Colors.accent.purple} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Crew Activity
                    </Text>
                    <Text variant="caption" color="secondary">
                      Updates from your crews
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.crew_activity}
                  onValueChange={(value) => handleToggle('crew_activity', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </Card>
          </View>

          {/* Social Notifications */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Social Notifications
            </Text>
            <Card variant="liquid">
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="chatbubble" size={24} color={Colors.accent.green} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Messages
                    </Text>
                    <Text variant="caption" color="secondary">
                      New direct messages
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.messages}
                  onValueChange={(value) => handleToggle('messages', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="heart" size={24} color={Colors.accent.pink} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Vouches
                    </Text>
                    <Text variant="caption" color="secondary">
                      When someone vouches for you
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.vouches}
                  onValueChange={(value) => handleToggle('vouches', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="person-add" size={24} color={Colors.accent.cyan} style={styles.settingIcon} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold">
                      Friend Requests
                    </Text>
                    <Text variant="caption" color="secondary">
                      New friend requests
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.friend_requests}
                  onValueChange={(value) => handleToggle('friend_requests', value)}
                  trackColor={{ false: Colors.surface, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </Card>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  pushPrompt: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  pushIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
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
    marginRight: Spacing.md,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.dark,
    marginVertical: Spacing.sm,
  },
});
