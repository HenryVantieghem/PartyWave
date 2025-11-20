import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { useUserStore } from '@/stores/userStore';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, user } = useAuthStore();
  const { fetchMemories, memories } = usePartyStore();
  const { fetchAchievements, achievements, fetchConnections } = useUserStore();
  const [activeTab, setActiveTab] = useState<'memories' | 'achievements'>('memories');
  const [userMemories, setUserMemories] = useState<any[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadProfileData();
    }
  }, [profile?.id]);

  const loadProfileData = async () => {
    if (!profile?.id) return;
    
    setIsLoadingMemories(true);
    setIsLoadingAchievements(true);
    
    try {
      await fetchUserMemories();
      await fetchAchievements(profile.id);
      await fetchConnections(profile.id);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoadingMemories(false);
      setIsLoadingAchievements(false);
    }
  };

  const fetchUserMemories = async () => {
    if (!profile?.id) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('party_memories')
        .select(`
          *,
          party:parties(id, name, host_id),
          user:profiles(id, display_name, avatar_url)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUserMemories(data || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
      setUserMemories([]);
    }
  };

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
    Alert.alert('Coming Soon', 'This feature is coming soon!');
  };

  const handleTabChange = (tab: 'memories' | 'achievements') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleMemoryPress = (memory: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (memory.party?.id) {
      router.push(`/party/${memory.party.id}`);
    }
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', route: '/profile/edit', color: Colors.primary },
    { icon: 'settings-outline', label: 'Settings', route: '/settings', color: Colors.text.secondary },
    { icon: 'notifications-outline', label: 'Notifications', route: '/notifications', color: Colors.accent.orange },
    { icon: 'heart-outline', label: 'Saved Parties', route: '/saved', color: Colors.primary },
    { icon: 'help-circle-outline', label: 'Help & Support', route: '/help', color: Colors.secondary },
  ];

  // Get connections count
  const userConnections = useUserStore.getState().connections;
  
  // Stats matching screenshot exactly - 3x2 grid
  const stats = [
    {
      icon: 'calendar-outline',
      value: profile?.total_parties_hosted || 0,
      label: 'Parties Hosted',
      color: Colors.primary,
    },
    {
      icon: 'people-outline',
      value: profile?.total_parties_attended || 0,
      label: 'Parties Attended',
      color: Colors.primary,
    },
    {
      icon: 'heart-outline',
      value: userConnections.length || 0,
      label: 'Friends Made',
      color: Colors.primary,
    },
    {
      icon: 'trophy-outline',
      value: achievements.filter((a: any) => a.achievement_type === 'mvp').length || 0,
      label: 'Party MVP',
      color: Colors.accent.gold,
    },
    {
      icon: 'camera-outline',
      value: userMemories.length || 0,
      label: 'Photos Shared',
      color: Colors.accent.gold,
    },
    {
      icon: 'star',
      value: '🎂',
      label: 'Favorite Vibe',
      color: Colors.accent.gold,
    },
  ];

  // Format memories for display matching screenshot
  const formattedMemories = userMemories.slice(0, 10).map((memory: any) => ({
    id: memory.id,
    title: memory.party?.name || 'Party Memory',
    badge: memory.party?.host_id === profile?.id ? 'Host' : 'Guest',
    badgeColor: memory.party?.host_id === profile?.id ? Colors.primary : Colors.secondary,
    emoji: memory.party?.name?.includes('Birthday') ? '🎂' : memory.party?.name?.includes('House') ? '🏠' : '🎉',
    image: memory.media_url,
    partyId: memory.party?.id,
  }));

  // Format achievements
  const formattedAchievements = achievements.map((achievement: any) => {
    const data = achievement.achievement_data || {};
    return {
      id: achievement.id,
      icon: data.icon || '🏆',
      title: data.title || 'Achievement',
      description: data.description || '',
      unlockedAt: achievement.unlocked_at,
    };
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h2" weight="black" center style={styles.headerTitle}>
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
              {profile?.display_name || 'Party Legend'}
            </Text>

            <Text variant="body" center color="secondary" style={styles.bio}>
              {profile?.bio || 'Party enthusiast • Social connector • Memory maker'}
            </Text>
          </View>

          {/* Stats Grid - 3x2 matching screenshot */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <Card key={index} variant="liquid" style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  {typeof stat.value === 'string' ? (
                    <Text variant="h3" style={styles.statEmoji}>{stat.value}</Text>
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
          <Card variant="liquid" style={styles.tabsCard}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'memories' && styles.tabActive]}
                onPress={() => handleTabChange('memories')}
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
                onPress={() => handleTabChange('achievements')}
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
          </Card>

          {/* Content */}
          {activeTab === 'memories' ? (
            <View style={styles.section}>
              <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                Recent Party Memories
              </Text>

              {isLoadingMemories ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : formattedMemories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="camera-outline" size={48} color={Colors.text.tertiary} />
                  <Text variant="body" center color="secondary" style={styles.emptyText}>
                    No memories yet. Start capturing party moments!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push('/(tabs)/camera');
                    }}
                  >
                    <Text variant="body" weight="semibold" color="accent">
                      Capture Memory →
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.memoriesScroll}
                >
                  {formattedMemories.map((memory) => (
                    <TouchableOpacity
                      key={memory.id}
                      style={styles.memoryCard}
                      onPress={() => handleMemoryPress(memory)}
                    >
                      {memory.image ? (
                        <Image source={{ uri: memory.image }} style={styles.memoryImage} />
                      ) : (
                        <LinearGradient
                          colors={['rgba(26, 26, 26, 0.9)', 'rgba(26, 26, 26, 0.7)']}
                          style={styles.memoryGradient}
                        />
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                        style={styles.memoryOverlay}
                      >
                        <View style={styles.memoryTop}>
                          <Text variant="h3" style={styles.memoryEmoji}>
                            {memory.emoji}
                          </Text>
                          <View style={[styles.memoryBadge, { backgroundColor: memory.badgeColor }]}>
                            <Text variant="label" color="white" style={styles.memoryBadgeText}>
                              {memory.badge}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.memoryTitle}>
                          <Text variant="caption" weight="medium" numberOfLines={2} color="white">
                            {memory.title}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                Your Achievements
              </Text>

              {isLoadingAchievements ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : formattedAchievements.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="trophy-outline" size={48} color={Colors.text.tertiary} />
                  <Text variant="body" center color="secondary" style={styles.emptyText}>
                    No achievements yet. Start partying to unlock!
                  </Text>
                </View>
              ) : (
                <View style={styles.achievementsGrid}>
                  {formattedAchievements.map((achievement) => (
                    <Card key={achievement.id} variant="liquid" style={styles.achievementCard}>
                      <Text variant="h2" style={styles.achievementIcon}>
                        {achievement.icon}
                      </Text>
                      <Text variant="caption" center weight="medium" numberOfLines={2}>
                        {achievement.title}
                      </Text>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          )}

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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
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
    maxWidth: 300,
  },
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
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    marginBottom: Spacing.xxs,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  tabsCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  memoriesScroll: {
    paddingRight: Spacing.lg,
  },
  memoryCard: {
    width: 160,
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
    backgroundColor: Colors.card,
  },
  memoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  memoryGradient: {
    width: '100%',
    height: '100%',
  },
  memoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  memoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    paddingTop: Spacing.sm,
  },
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
  loadingContainer: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  emptyButton: {
    padding: Spacing.md,
  },
  menu: {
    marginTop: Spacing.xl,
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
