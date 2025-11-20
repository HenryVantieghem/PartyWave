import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
          },
        },
      ]
    );
  };

  const handleMenuPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to route when screens are created
    Alert.alert('Coming Soon', 'This feature is coming soon!');
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', route: '/profile/edit', color: Colors.primary },
    { icon: 'settings-outline', label: 'Settings', route: '/settings', color: Colors.text.secondary },
    { icon: 'notifications-outline', label: 'Notifications', route: '/notifications', color: Colors.accent.orange },
    { icon: 'heart-outline', label: 'Saved Parties', route: '/saved', color: Colors.primary },
    { icon: 'help-circle-outline', label: 'Help & Support', route: '/help', color: Colors.secondary },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h2" weight="black" style={styles.headerTitle}>
              Profile
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/passport');
              }}
            >
              <Ionicons name="ticket" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <Card variant="glass" style={styles.profileCard}>
            <Avatar
              source={profile?.avatar_url}
              name={profile?.display_name}
              size="xl"
              gradient
            />
            <Text variant="h3" weight="bold" center style={styles.displayName}>
              {profile?.display_name || 'Party Legend'}
            </Text>
            <Text variant="body" center color="secondary" style={styles.username}>
              @{profile?.username}
            </Text>
            {profile?.bio && (
              <Text variant="body" center color="secondary" style={styles.bio}>
                {profile.bio}
              </Text>
            )}
          </Card>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <LinearGradient
                colors={[Colors.primary + '20', Colors.primary + '10']}
                style={styles.statGradient}
              >
                <Ionicons name="trophy" size={24} color={Colors.accent.gold} />
              </LinearGradient>
              <Text variant="h3" weight="bold" center style={styles.statValue}>
                {profile?.party_score || 0}
              </Text>
              <Text variant="caption" center color="secondary">
                Party Score
              </Text>
            </View>
            <View style={styles.stat}>
              <LinearGradient
                colors={[Colors.secondary + '20', Colors.secondary + '10']}
                style={styles.statGradient}
              >
                <Ionicons name="flame" size={24} color={Colors.accent.orange} />
              </LinearGradient>
              <Text variant="h3" weight="bold" center style={styles.statValue}>
                {profile?.party_streak || 0}
              </Text>
              <Text variant="caption" center color="secondary">
                Day Streak
              </Text>
            </View>
            <View style={styles.stat}>
              <LinearGradient
                colors={[Colors.accent.purple + '20', Colors.accent.purple + '10']}
                style={styles.statGradient}
              >
                <Ionicons name="people" size={24} color={Colors.accent.purple} />
              </LinearGradient>
              <Text variant="h3" weight="bold" center style={styles.statValue}>
                {profile?.total_parties_hosted || 0}
              </Text>
              <Text variant="caption" center color="secondary">
                Hosted
              </Text>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menu}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleMenuPress(item.route)}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
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
            onPress={handleSignOut}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
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
  username: {
    marginBottom: Spacing.xs,
  },
  bio: {
    marginTop: Spacing.sm,
    fontSize: 14,
    lineHeight: 20,
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
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    marginBottom: Spacing.xxs,
  },
  menu: {
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    flex: 1,
  },
  signOutButton: {
    marginTop: Spacing.lg,
  },
});
