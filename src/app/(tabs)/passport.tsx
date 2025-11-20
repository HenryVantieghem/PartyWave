import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function PassportScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { myParties, fetchMyParties } = usePartyStore();
  const [activeTab, setActiveTab] = useState<'memories' | 'achievements'>('memories');

  useEffect(() => {
    if (profile) {
      fetchMyParties(profile.id);
    }
  }, [profile]);

  const stats = [
    {
      icon: 'calendar',
      value: profile?.total_parties_hosted || 12,
      label: 'Parties Hosted',
      color: Colors.primary,
    },
    {
      icon: 'people',
      value: profile?.total_parties_attended || 47,
      label: 'Parties Attended',
      color: Colors.secondary,
    },
    {
      icon: 'heart',
      value: 156,
      label: 'Friends Made',
      color: Colors.accent.purple,
    },
    {
      icon: 'trophy',
      value: 8,
      label: 'Party MVP',
      color: Colors.accent.gold,
    },
    {
      icon: 'camera',
      value: 324,
      label: 'Photos Shared',
      color: Colors.accent.orange,
    },
    {
      icon: 'star',
      value: '🎂',
      label: 'Favorite Vibe',
      color: Colors.accent.gold,
    },
  ];

  // Mock memories
  const memories = [
    {
      id: '1',
      image: null,
      title: 'Scrubb 21st Birthday',
      badge: 'Guest',
      badgeColor: Colors.secondary,
      emoji: '🎂',
    },
    {
      id: '2',
      image: null,
      title: 'House Warming Party',
      badge: 'Host',
      badgeColor: Colors.primary,
      emoji: '🏠',
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h2" weight="black" style={styles.headerTitle}>
              Party Resume
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Avatar source={profile?.avatar_url} name={profile?.display_name} size="sm" />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Avatar
              source={profile?.avatar_url}
              name={profile?.display_name}
              size="2xl"
              gradient
              style={styles.avatar}
            />

            <Text variant="h2" weight="bold" center style={styles.displayName}>
              {profile?.display_name || 'Alex Chen'}
            </Text>

            <Text variant="body" center color="secondary" style={styles.bio}>
              {profile?.bio || 'Party enthusiast • Social connector • Memory maker'}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <Card key={index} variant="default" style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  {typeof stat.value === 'string' ? (
                    <Text variant="h3">{stat.value}</Text>
                  ) : (
                    <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                  )}
                </View>

                <Text variant="h3" weight="bold" center style={styles.statValue}>
                  {stat.value}
                </Text>

                <Text variant="caption" center color="secondary" style={styles.statLabel}>
                  {stat.label}
                </Text>
              </Card>
            ))}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'memories' && styles.tabActive]}
              onPress={() => setActiveTab('memories')}
            >
              <Text
                variant="body"
                weight="semibold"
                color={activeTab === 'memories' ? 'white' : 'secondary'}
              >
                Memories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
              onPress={() => setActiveTab('achievements')}
            >
              <Text
                variant="body"
                weight="semibold"
                color={activeTab === 'achievements' ? 'white' : 'secondary'}
              >
                Achievements
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'memories' ? (
            <View style={styles.section}>
              <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                Recent Party Memories
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.memoriesScroll}
              >
                {memories.map((memory) => (
                  <TouchableOpacity
                    key={memory.id}
                    style={styles.memoryCard}
                    onPress={() => {/* TODO: Open memory detail */}}
                  >
                    <LinearGradient
                      colors={['rgba(26, 26, 26, 0.9)', 'rgba(26, 26, 26, 0.7)']}
                      style={styles.memoryGradient}
                    >
                      <View style={styles.memoryTop}>
                        <Text variant="h2" style={styles.memoryEmoji}>
                          {memory.emoji}
                        </Text>
                        <View style={[styles.memoryBadge, { backgroundColor: memory.badgeColor }]}>
                          <Text variant="label" color="white" style={styles.memoryBadgeText}>
                            {memory.badge}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>

                    <View style={styles.memoryTitle}>
                      <Text variant="caption" weight="medium" numberOfLines={2} color="white">
                        {memory.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.section}>
              <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                Your Achievements
              </Text>

              <View style={styles.achievementsGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} variant="glass" style={styles.achievementCard}>
                    <Text variant="h2" style={styles.achievementIcon}>
                      🏆
                    </Text>
                    <Text variant="caption" center weight="medium" numberOfLines={2}>
                      Party Starter
                    </Text>
                  </Card>
                ))}
              </View>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.primary,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  avatar: {
    marginBottom: Spacing.xl,
  },
  displayName: {
    marginBottom: Spacing.md,
    fontSize: 28,
    lineHeight: 34,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    padding: Spacing.base,
    alignItems: 'center',
  },
  statIcon: {
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
  statLabel: {
    fontSize: 11,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },

  // Section
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },

  // Memories Scroll
  memoriesScroll: {
    paddingRight: Spacing.lg,
  },
  memoryCard: {
    width: 160,
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  memoryGradient: {
    flex: 1,
  },
  memoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.md,
  },
  memoryEmoji: {
    fontSize: 24,
  },
  memoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  memoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  memoryTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  // Achievements Grid
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  achievementCard: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    aspectRatio: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
});
