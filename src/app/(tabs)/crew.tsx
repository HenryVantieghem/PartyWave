import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { formatRelativeTime } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function CrewScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const {
    connections,
    users,
    pendingRequests,
    isLoading,
    fetchConnections,
    fetchPendingRequests,
    searchUsers,
    sendConnectionRequest,
    acceptConnectionRequest,
    removeConnection,
  } = useUserStore();
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'crew' | 'suggestions'>('crew');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchConnections(profile.id);
      fetchPendingRequests(profile.id);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!profile?.id) return;
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      // Filter out current user and existing connections
      const filtered = results.filter(
        (u) =>
          u.id !== profile.id &&
          !connections.some((c) => c.friend_id === u.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTabChange = (tab: 'crew' | 'suggestions') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleAddFriend = async (friendId: string) => {
    if (!profile?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sendConnectionRequest(profile.id, friendId);
      showToast('Friend request sent!', 'success');
      setSearchResults(searchResults.filter((u) => u.id !== friendId));
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message || 'Failed to send request', 'error');
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await acceptConnectionRequest(connectionId);
      showToast('Friend request accepted!', 'success');
      if (profile?.id) {
        fetchConnections(profile.id);
        fetchPendingRequests(profile.id);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message || 'Failed to accept request', 'error');
    }
  };

  const handleInviteToParty = (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Navigate to party creation with friend pre-selected
    router.push('/party/create');
  };

  const stats = [
    { icon: 'people', value: connections.length, label: 'Friends' },
    { icon: 'star', value: connections.filter((c) => (c.friend?.party_score || 0) > 100).length, label: 'Party BFFs' },
    { icon: 'heart', value: pendingRequests.length, label: 'New Requests' },
  ];

  // Get BFF status (simplified - could be based on party interactions)
  const getFriendTitle = (friend: any) => {
    if (friend.party_score > 100) return { title: 'Party Legend', icon: 'trophy', color: Colors.accent.gold };
    if (friend.total_parties_hosted > 10) return { title: 'Host Master', icon: 'home', color: Colors.text.secondary };
    if (friend.total_parties_attended > 20) return { title: 'Memory Maker', icon: 'camera', color: Colors.accent.blue };
    return { title: 'Party Friend', icon: 'people', color: Colors.text.secondary };
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="black" style={styles.headerTitle}>
            Party Crew
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Avatar source={profile?.avatar_url} name={profile?.display_name} size="sm" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <Card variant="liquid" style={styles.searchCard}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your party crew..."
                placeholderTextColor={Colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </Card>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <Card key={index} variant="liquid" style={styles.statItem}>
                <Ionicons name={stat.icon as any} size={24} color={Colors.primary} />
                <Text variant="h3" weight="bold" center style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text variant="caption" center color="secondary" style={styles.statLabel}>
                  {stat.label}
                </Text>
              </Card>
            ))}
          </View>

          {/* Segmented Control */}
          <Card variant="liquid" style={styles.segmentedControlCard}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segment, activeTab === 'crew' && styles.segmentActive]}
                onPress={() => handleTabChange('crew')}
              >
                <Text
                  variant="body"
                  weight="semibold"
                  color={activeTab === 'crew' ? 'white' : 'secondary'}
                >
                  My Crew
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, activeTab === 'suggestions' && styles.segmentActive]}
                onPress={() => handleTabChange('suggestions')}
              >
                <Text
                  variant="body"
                  weight="semibold"
                  color={activeTab === 'suggestions' ? 'white' : 'secondary'}
                >
                  Suggestions
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Content */}
          {activeTab === 'crew' ? (
            <View style={styles.content}>
              {pendingRequests.length > 0 && (
                <View style={styles.section}>
                  <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                    Pending Requests
                  </Text>
                  {pendingRequests.map((request) => (
                    <Card key={request.id} variant="liquid" style={styles.memberCard}>
                      <View style={styles.memberContent}>
                        <Avatar
                          source={request.friend?.avatar_url}
                          name={request.friend?.display_name}
                          size="lg"
                          gradient
                        />
                        <View style={styles.memberInfo}>
                          <Text variant="body" weight="bold" style={styles.memberName}>
                            {request.friend?.display_name}
                          </Text>
                          <Text variant="caption" color="secondary" style={styles.memberUsername}>
                            @{request.friend?.username}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleAcceptRequest(request.id)}
                        >
                          <Text variant="label" color="white" weight="semibold">
                            Accept
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                  ))}
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                  Your Party Crew
                </Text>
                <Text variant="caption" color="tertiary" style={styles.sectionSubtitle}>
                  Friends you party with most
                </Text>
              </View>

              {isLoading && connections.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : connections.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={Colors.text.tertiary} />
                  <Text variant="body" center color="secondary" style={styles.emptyText}>
                    No friends yet. Start adding people to build your crew!
                  </Text>
                </View>
              ) : (
                connections.map((connection) => {
                  const friend = connection.friend;
                  if (!friend) return null;
                  const titleInfo = getFriendTitle(friend);
                  const isBFF = friend.party_score > 100;

                  return (
                    <Card key={connection.id} variant="liquid" style={styles.memberCard}>
                      <View style={styles.memberContent}>
                        <Avatar
                          source={friend.avatar_url}
                          name={friend.display_name}
                          size="lg"
                          gradient
                        />
                        <View style={styles.memberInfo}>
                          <View style={styles.memberHeader}>
                            <Text variant="body" weight="bold" style={styles.memberName}>
                              {friend.display_name}
                            </Text>
                            {isBFF && (
                              <Ionicons name="star" size={16} color={Colors.accent.gold} />
                            )}
                          </View>
                          <View style={styles.memberTitleRow}>
                            <Ionicons name={titleInfo.icon as any} size={14} color={titleInfo.color} />
                            <Text variant="caption" color="secondary" style={styles.memberTitle}>
                              {titleInfo.title}
                            </Text>
                          </View>
                          <View style={styles.memberStats}>
                            <View style={styles.memberStatItem}>
                              <Ionicons name="calendar" size={14} color={Colors.text.tertiary} />
                              <Text variant="caption" color="tertiary" style={styles.memberStatText}>
                                {friend.total_parties_attended} parties
                              </Text>
                            </View>
                            <View style={styles.memberStatItem}>
                              <Ionicons name="flash" size={14} color={Colors.accent.orange} />
                              <Text variant="caption" color="tertiary" style={styles.memberStatText}>
                                {friend.party_score} score
                              </Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.inviteButton}
                          onPress={() => handleInviteToParty(friend.id)}
                        >
                          <Ionicons name="add" size={20} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.sectionHeader}>
                <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                  {searchQuery.length > 2 ? 'Search Results' : 'Suggested Friends'}
                </Text>
                <Text variant="caption" color="tertiary" style={styles.sectionSubtitle}>
                  {searchQuery.length > 2 ? 'Find people to add' : 'People you might know'}
                </Text>
              </View>

              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : searchResults.length === 0 && searchQuery.length > 2 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={Colors.text.tertiary} />
                  <Text variant="body" center color="secondary" style={styles.emptyText}>
                    No users found
                  </Text>
                </View>
              ) : (
                searchResults.map((user) => (
                  <Card key={user.id} variant="liquid" style={styles.memberCard}>
                    <View style={styles.memberContent}>
                      <Avatar
                        source={user.avatar_url}
                        name={user.display_name}
                        size="lg"
                        gradient
                      />
                      <View style={styles.memberInfo}>
                        <Text variant="body" weight="bold" style={styles.memberName}>
                          {user.display_name}
                        </Text>
                        <Text variant="caption" color="secondary" style={styles.memberUsername}>
                          @{user.username}
                        </Text>
                        {user.bio && (
                          <Text variant="caption" color="tertiary" style={styles.memberBio} numberOfLines={1}>
                            {user.bio}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddFriend(user.id)}
                      >
                        <Text variant="label" color="white" weight="semibold">
                          Add
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  headerTitle: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  searchCard: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
  },
  statValue: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  statLabel: {
    fontSize: 11,
  },
  segmentedControlCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    marginTop: Spacing.base,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xxs,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  memberCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  memberName: {
    fontSize: 16,
  },
  memberTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  memberTitle: {
    fontSize: 12,
  },
  memberStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  memberStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberStatText: {
    fontSize: 11,
  },
  lastPartied: {
    fontSize: 11,
    marginTop: Spacing.xxs,
  },
  memberUsername: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  mutualFriends: {
    fontSize: 11,
  },
  inviteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  acceptButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
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
    maxWidth: 280,
  },
  memberBio: {
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
});

