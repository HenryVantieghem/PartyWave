import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useCrewStore } from '@/stores/crewStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { Crew } from '@/types/crew';

interface DiscoveredCrew extends Crew {
  matchScore: number;
  matchReasons: string[];
  mutualFriends?: number;
}

export default function CrewDiscoverScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { myCrews, addCrewMember } = useCrewStore();

  const [discoveredCrews, setDiscoveredCrews] = useState<DiscoveredCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'recommended' | 'nearby'>('recommended');
  const [joiningCrewId, setJoiningCrewId] = useState<string | null>(null);

  useEffect(() => {
    discoverCrews();
  }, [filterType]);

  const discoverCrews = async () => {
    try {
      setLoading(true);

      // Fetch public crews that user is not already a member of
      const myCrewIds = myCrews.map((c) => c.id);

      const { data: publicCrews, error } = await supabase
        .from('party_crews')
        .select('*')
        .eq('active_status', true)
        .eq('privacy_setting', 'public')
        .not('id', 'in', `(${myCrewIds.length > 0 ? myCrewIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order('reputation_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate match scores
      const crewsWithScores = await Promise.all(
        (publicCrews || []).map(async (crew) => {
          const { score, reasons } = await calculateMatchScore(crew);
          return {
            ...crew,
            matchScore: score,
            matchReasons: reasons,
          };
        })
      );

      // Sort by match score
      crewsWithScores.sort((a, b) => b.matchScore - a.matchScore);

      setDiscoveredCrews(crewsWithScores);
    } catch (error) {
      console.error('Error discovering crews:', error);
      Alert.alert('Error', 'Failed to load crews');
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = async (crew: Crew): Promise<{ score: number; reasons: string[] }> => {
    let score = 0;
    const reasons: string[] = [];

    // Base score from reputation
    score += Math.min(crew.reputation_score / 10, 20);

    // Active crew bonus
    if (crew.member_count > 5 && crew.member_count < 50) {
      score += 15;
      reasons.push('Active community size');
    }

    // Similar size to user's crews
    if (myCrews.length > 0) {
      const avgMyCrewSize = myCrews.reduce((sum, c) => sum + c.member_count, 0) / myCrews.length;
      const sizeDiff = Math.abs(crew.member_count - avgMyCrewSize);
      if (sizeDiff < 10) {
        score += 10;
        reasons.push('Similar community size');
      }
    }

    // Crew type preference
    const openCrews = myCrews.filter((c) => c.crew_type === 'open').length;
    if (openCrews > myCrews.length / 2 && crew.crew_type === 'open') {
      score += 15;
      reasons.push('Matches your crew style');
    }

    // Check for mutual members
    try {
      const { data: mutualMembers } = await supabase
        .from('crew_members')
        .select('user_id')
        .eq('crew_id', crew.id)
        .in(
          'user_id',
          myCrews.flatMap((c) => {
            // This is a simplified version - in production you'd query the actual members
            return [];
          })
        );

      if (mutualMembers && mutualMembers.length > 0) {
        score += mutualMembers.length * 5;
        reasons.push(`${mutualMembers.length} mutual member${mutualMembers.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      // Ignore error
    }

    // High reputation bonus
    if (crew.reputation_score > 80) {
      score += 10;
      reasons.push('Highly rated crew');
    }

    // Add randomness to prevent stale recommendations
    score += Math.random() * 5;

    return { score, reasons };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await discoverCrews();
    setRefreshing(false);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleJoinCrew = async (crewId: string, crewName: string) => {
    Alert.alert('Join Crew', `Request to join ${crewName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Join',
        onPress: async () => {
          try {
            setJoiningCrewId(crewId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (!profile?.id) throw new Error('Not authenticated');

            // Add user as member (pending approval for closed crews)
            await addCrewMember(crewId, profile.id);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `You've joined ${crewName}!`, [
              { text: 'OK', onPress: () => router.push(`/crew/${crewId}` as any) },
            ]);

            // Remove from discovered list
            setDiscoveredCrews((prev) => prev.filter((c) => c.id !== crewId));
          } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message || 'Failed to join crew');
          } finally {
            setJoiningCrewId(null);
          }
        },
      },
    ]);
  };

  const getCrewTypeIcon = (crewType: string) => {
    switch (crewType) {
      case 'inner':
        return 'lock-closed';
      case 'extended':
        return 'people';
      case 'open':
        return 'earth';
      default:
        return 'people';
    }
  };

  const getCrewTypeColor = (crewType: string) => {
    switch (crewType) {
      case 'inner':
        return Colors.accent.purple;
      case 'extended':
        return Colors.accent.blue;
      case 'open':
        return Colors.accent.green;
      default:
        return Colors.text.secondary;
    }
  };

  const filteredCrews = discoveredCrews.filter((crew) => {
    if (filterType === 'all') return true;
    if (filterType === 'recommended') return crew.matchScore > 20;
    if (filterType === 'nearby') return crew.matchScore > 15; // Simplified
    return true;
  });

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
              Discover Crews
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterType('recommended');
              }}
              style={[styles.filterTab, filterType === 'recommended' && styles.filterTabActive]}
            >
              <Text
                variant="body"
                weight={filterType === 'recommended' ? 'bold' : 'medium'}
                color={filterType === 'recommended' ? 'white' : 'secondary'}
              >
                For You
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterType('all');
              }}
              style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
            >
              <Text
                variant="body"
                weight={filterType === 'all' ? 'bold' : 'medium'}
                color={filterType === 'all' ? 'white' : 'secondary'}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterType('nearby');
              }}
              style={[styles.filterTab, filterType === 'nearby' && styles.filterTabActive]}
            >
              <Text
                variant="body"
                weight={filterType === 'nearby' ? 'bold' : 'medium'}
                color={filterType === 'nearby' ? 'white' : 'secondary'}
              >
                Nearby
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text variant="body" color="secondary" style={{ marginTop: Spacing.md }}>
              Finding crews for you...
            </Text>
          </View>
        ) : filteredCrews.length === 0 ? (
          <Card variant="liquid" style={{ marginTop: Spacing.xl }}>
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color={Colors.text.tertiary} />
              <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
                No Crews Found
              </Text>
              <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          </Card>
        ) : (
          filteredCrews.map((crew) => (
            <Card key={crew.id} variant="liquid" style={styles.crewCard}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/crew/${crew.id}` as any);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.crewHeader}>
                  <Avatar
                    source={{ uri: crew.avatar_url }}
                    size="lg"
                    fallbackText={crew.name}
                    style={{ backgroundColor: crew.theme_color || Colors.primary }}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <View style={styles.crewNameRow}>
                      <Text variant="h4" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                        {crew.name}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: getCrewTypeColor(crew.crew_type) }]}>
                        <Ionicons name={getCrewTypeIcon(crew.crew_type) as any} size={12} color={Colors.white} />
                        <Text variant="caption" weight="semibold" color="white" style={{ marginLeft: 4 }}>
                          {crew.crew_type}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.crewStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="people" size={14} color={Colors.text.secondary} />
                        <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                          {crew.member_count} members
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="star" size={14} color={Colors.accent.gold} />
                        <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                          {Math.round(crew.reputation_score)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {crew.description && (
                  <Text variant="body" color="secondary" numberOfLines={2} style={{ marginTop: Spacing.sm }}>
                    {crew.description}
                  </Text>
                )}

                {/* Match Reasons */}
                {crew.matchReasons.length > 0 && (
                  <View style={styles.matchReasons}>
                    {crew.matchReasons.slice(0, 3).map((reason, index) => (
                      <View key={index} style={styles.reasonChip}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.accent.green} />
                        <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                          {reason}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Join Button */}
              <TouchableOpacity
                onPress={() => handleJoinCrew(crew.id, crew.name)}
                disabled={joiningCrewId === crew.id}
                style={styles.joinButton}
              >
                <LinearGradient colors={Gradients.party} style={styles.joinGradient}>
                  {joiningCrewId === crew.id ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={18} color={Colors.white} />
                      <Text variant="body" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                        Join Crew
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Card>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  crewCard: {
    marginBottom: Spacing.base,
  },
  crewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  crewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  crewStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(75, 181, 67, 0.1)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(75, 181, 67, 0.2)',
  },
  joinButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  joinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
});
