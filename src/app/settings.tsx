import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [partyInvites, setPartyInvites] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [partyReminders, setPartyReminders] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear the app cache?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Cache cleared successfully!');
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: 'Notifications',
      icon: 'notifications-outline',
      color: Colors.accent.orange,
      items: [
        {
          label: 'Push Notifications',
          description: 'Receive notifications on your device',
          value: pushNotifications,
          onValueChange: setPushNotifications,
        },
        {
          label: 'Party Invites',
          description: 'Get notified when someone invites you to a party',
          value: partyInvites,
          onValueChange: setPartyInvites,
        },
        {
          label: 'Friend Requests',
          description: 'Get notified about new friend requests',
          value: friendRequests,
          onValueChange: setFriendRequests,
        },
        {
          label: 'Party Reminders',
          description: 'Remind me about upcoming parties',
          value: partyReminders,
          onValueChange: setPartyReminders,
        },
        {
          label: 'Messages',
          description: 'Get notified about new messages',
          value: messageNotifications,
          onValueChange: setMessageNotifications,
        },
      ],
    },
    {
      title: 'Privacy',
      icon: 'shield-checkmark-outline',
      color: Colors.secondary,
      items: [
        {
          label: 'Private Account',
          description: 'Only approved friends can see your parties',
          value: privateAccount,
          onValueChange: setPrivateAccount,
        },
        {
          label: 'Show Online Status',
          description: 'Let friends see when you\'re active',
          value: showOnlineStatus,
          onValueChange: setShowOnlineStatus,
        },
      ],
    },
    {
      title: 'Location',
      icon: 'location-outline',
      color: Colors.primary,
      items: [
        {
          label: 'Location Services',
          description: 'Allow app to access your location for nearby parties',
          value: locationServices,
          onValueChange: setLocationServices,
        },
      ],
    },
  ];

  const actionItems = [
    {
      icon: 'trash-outline',
      label: 'Clear Cache',
      description: 'Free up storage space',
      color: Colors.text.secondary,
      onPress: handleClearCache,
    },
    {
      icon: 'document-text-outline',
      label: 'Terms of Service',
      description: 'Read our terms and conditions',
      color: Colors.text.secondary,
      onPress: () => Alert.alert('Coming Soon', 'Terms of Service will be available soon.'),
    },
    {
      icon: 'shield-outline',
      label: 'Privacy Policy',
      description: 'Learn how we protect your data',
      color: Colors.text.secondary,
      onPress: () => Alert.alert('Coming Soon', 'Privacy Policy will be available soon.'),
    },
    {
      icon: 'information-circle-outline',
      label: 'About',
      description: 'App version and information',
      color: Colors.text.secondary,
      onPress: () => Alert.alert('The Hangout', 'Version 1.0.0\n\nA social party discovery app.'),
    },
  ];

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
            Settings
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
                  <Ionicons name={section.icon as any} size={20} color={section.color} />
                </View>
                <Text variant="h4" weight="bold">
                  {section.title}
                </Text>
              </View>

              <Card variant="liquid">
                {section.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      itemIndex < section.items.length - 1 && styles.settingItemBorder,
                    ]}
                  >
                    <View style={styles.settingInfo}>
                      <Text variant="body" weight="semibold">
                        {item.label}
                      </Text>
                      <Text variant="caption" color="secondary" style={styles.settingDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={(value) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        item.onValueChange(value);
                      }}
                      trackColor={{
                        false: 'rgba(255, 255, 255, 0.1)',
                        true: Colors.primary + '80',
                      }}
                      thumbColor={item.value ? Colors.primary : Colors.text.tertiary}
                      ios_backgroundColor="rgba(255, 255, 255, 0.1)"
                    />
                  </View>
                ))}
              </Card>
            </View>
          ))}

          {/* Actions */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              More
            </Text>

            <Card variant="liquid">
              {actionItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    item.onPress();
                  }}
                  style={[
                    styles.actionItem,
                    index < actionItems.length - 1 && styles.actionItemBorder,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionItemContent}>
                    <View style={[styles.actionIcon, { backgroundColor: item.color + '20' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={styles.actionInfo}>
                      <Text variant="body" weight="semibold">
                        {item.label}
                      </Text>
                      <Text variant="caption" color="secondary" style={styles.actionDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Danger Zone
            </Text>

            <Card variant="liquid" style={styles.dangerCard}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleDeleteAccount();
                }}
                style={styles.dangerItem}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemContent}>
                  <View style={[styles.actionIcon, { backgroundColor: Colors.error + '20' }]}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </View>
                  <View style={styles.actionInfo}>
                    <Text variant="body" weight="semibold" color="error">
                      Delete Account
                    </Text>
                    <Text variant="caption" color="secondary" style={styles.actionDescription}>
                      Permanently delete your account and all data
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.error} />
              </TouchableOpacity>
            </Card>
          </View>

          {/* Sign Out Button */}
          <View style={styles.signOutSection}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: signOut,
                  },
                ]);
              }}
              style={styles.signOutButton}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text variant="body" weight="semibold" color="error">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingDescription: {
    marginTop: Spacing.xxs,
    lineHeight: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  actionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionDescription: {
    marginTop: Spacing.xxs,
    lineHeight: 16,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  signOutSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
});
