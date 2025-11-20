import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', route: '/profile/edit' },
    { icon: 'settings-outline', label: 'Settings', route: '/settings' },
    { icon: 'notifications-outline', label: 'Notifications', route: '/notifications' },
    { icon: 'heart-outline', label: 'Saved Parties', route: '/saved' },
    { icon: 'help-circle-outline', label: 'Help & Support', route: '/help' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <Card variant="glass" style={styles.profileCard}>
            <Avatar
              source={profile?.avatar_url}
              name={profile?.display_name}
              size="xl"
              gradient
            />
            <Text variant="h3" weight="bold" center style={styles.displayName}>
              {profile?.display_name}
            </Text>
            <Text variant="body" center color="secondary">
              @{profile?.username}
            </Text>
          </Card>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text variant="h3" weight="bold" center>
                {profile?.party_score || 0}
              </Text>
              <Text variant="caption" center color="secondary">
                Party Score
              </Text>
            </View>
            <View style={styles.stat}>
              <Text variant="h3" weight="bold" center>
                {profile?.party_streak || 0}
              </Text>
              <Text variant="caption" center color="secondary">
                Day Streak
              </Text>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menu}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {/* TODO: Navigate */}}
                style={styles.menuItem}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons name={item.icon as any} size={24} color={Colors.text.secondary} />
                  <Text variant="body" style={styles.menuItemLabel}>
                    {item.label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign Out */}
          <Button
            onPress={signOut}
            variant="danger"
            fullWidth
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  displayName: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stat: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: 16,
  },
  menu: {
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: Spacing.base,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemLabel: {
    flex: 1,
  },
  signOutButton: {
    marginTop: Spacing.lg,
  },
});
