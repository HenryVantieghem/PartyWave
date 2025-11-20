import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Animated,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { usePartyStore } from '@/stores/partyStore';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { parties, fetchParties, isLoading } = usePartyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'happening' | 'upcoming' | 'tonight'>('all');

  useEffect(() => {
    loadParties();
  }, [selectedFilter, searchQuery]);

  const loadParties = async () => {
    const filters: any = {};

    if (selectedFilter === 'happening') {
      filters.status = 'happening';
    } else if (selectedFilter === 'upcoming') {
      filters.status = 'upcoming';
    } else if (selectedFilter === 'tonight') {
      // Tonight filter would require date filtering - keeping simple for now
      filters.status = 'upcoming';
    }

    await fetchParties(filters);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParties();
    setRefreshing(false);
  };

  // Filter parties based on search query
  const filteredParties = parties.filter((party) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      party.name?.toLowerCase().includes(query) ||
      party.location_name?.toLowerCase().includes(query) ||
      party.description?.toLowerCase().includes(query) ||
      party.host?.display_name?.toLowerCase().includes(query)
    );
  });

  // Mock nearby parties matching screenshot exactly
  const nearbyParties = [
    { id: '1', name: 'Beach Bonfire\nHangout', distance: '0.4 mi', attendees: 7, emoji: '🔥' },
    { id: '2', name: 'Friday Night\nGame Night', distance: '1.9 mi', attendees: 10, emoji: '🏠' },
    { id: '3', name: 'Sarah\'s\nBirthday Bash', distance: '0.2 mi', attendees: 33, emoji: '🎂' },
  ];

  const quickActions = [
    {
      icon: 'flash',
      label: 'Start Party',
      color: Colors.primary,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/party/create');
      },
    },
    {
      icon: 'people',
      label: 'Invite Crew',
      color: Colors.secondary,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/(tabs)/crew');
      },
    },
  ];

  const filters = [
    { id: 'all', label: 'All Parties', icon: 'grid' },
    { id: 'happening', label: 'Live Now', icon: 'radio' },
    { id: 'tonight', label: 'Tonight', icon: 'moon' },
    { id: 'upcoming', label: 'Upcoming', icon: 'calendar' },
  ] as const;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h2" weight="black" style={styles.headerTitle}>
              Party Radar
            </Text>
            <Text variant="caption" color="secondary" style={styles.headerSubtitle}>
              Discover live parties near you
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="sparkles" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search parties, locations, hosts..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => {
                setSelectedFilter(filter.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive,
              ]}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.id ? Colors.white : Colors.text.secondary}
              />
              <Text
                variant="caption"
                weight="semibold"
                color={selectedFilter === filter.id ? 'white' : 'secondary'}
                style={styles.filterLabel}
              >
                {filter.label}
              </Text>
              {selectedFilter === filter.id && (
                <LinearGradient
                  colors={Gradients.primary}
                  style={styles.filterChipGradient}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Near You Section - Proximity Circles */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                Near You
              </Text>
            </View>

            <View style={styles.proximityContainer}>
              {nearbyParties.map((party, index) => (
                <TouchableOpacity
                  key={party.id}
                  style={[
                    styles.proximityCircle,
                    { transform: [{ scale: index === 1 ? 1 : 0.85 }] },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/party/${party.id}`);
                  }}
                >
                  <Card variant="liquid" style={styles.proximityCard}>
                    <LinearGradient
                      colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.05)']}
                      style={styles.proximityGradient}
                    >
                      <Text variant="h1" style={styles.proximityEmoji}>
                        {party.emoji}
                      </Text>
                      <Text variant="body" weight="bold" center style={styles.proximityName}>
                        {party.name}
                      </Text>
                      <Text variant="caption" color="secondary" center style={styles.proximityAttendees}>
                        {party.attendees} going
                      </Text>
                      <Text variant="caption" color="tertiary" center style={styles.proximityDistance}>
                        {party.distance}
                      </Text>
                    </LinearGradient>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, styles.quickActionsSection]}>
            <Text variant="h4" weight="bold" style={styles.quickActionsTitle}>
              Quick Actions
            </Text>

            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickAction}
                  onPress={action.action}
                >
                  <Card variant="liquid" style={styles.quickActionCard}>
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                      <Ionicons name={action.icon as any} size={32} color={action.color} />
                    </View>
                    <Text variant="body" weight="semibold" center style={styles.quickActionLabel}>
                      {action.label}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trending Parties */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flame" size={20} color={Colors.accent.orange} />
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                {searchQuery ? `Search Results (${filteredParties.length})` : 'Trending Now'}
              </Text>
            </View>

            {filteredParties.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={Colors.text.tertiary} />
                <Text variant="body" color="secondary" center style={styles.emptyText}>
                  {searchQuery ? 'No parties found matching your search' : 'No parties available'}
                </Text>
              </View>
            ) : (
              filteredParties.slice(0, 5).map((party) => (
              <TouchableOpacity
                key={party.id}
                onPress={() => router.push(`/party/${party.id}`)}
                style={styles.partyCard}
              >
                <Card variant="liquid">
                  <View style={styles.partyCardContent}>
                    {/* Party Image */}
                    {party.cover_image_url ? (
                      <View style={styles.partyImage} />
                    ) : (
                      <LinearGradient
                        colors={Gradients.primary}
                        style={styles.partyImagePlaceholder}
                      >
                        <Text variant="h1">🎉</Text>
                      </LinearGradient>
                    )}

                    {/* Party Info */}
                    <View style={styles.partyInfo}>
                      <Text variant="body" weight="bold" numberOfLines={1}>
                        {party.name}
                      </Text>
                      <Text variant="caption" color="secondary" numberOfLines={1}>
                        {party.location_name}
                      </Text>

                      <View style={styles.partyMeta}>
                        <View style={styles.partyMetaItem}>
                          <Ionicons name="people" size={14} color={Colors.text.tertiary} />
                          <Text variant="caption" color="tertiary">
                            24 going
                          </Text>
                        </View>
                        <View style={styles.partyMetaItem}>
                          <Ionicons name="flame" size={14} color={Colors.primary} />
                          <Text variant="caption" color="tertiary">
                            {party.energy_score}% energy
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
              ))
            )}
          </View>

          {/* Empty state if no parties - removed duplicate */}
          {false && parties.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text variant="h1" style={styles.emptyEmoji}>
                🎭
              </Text>
              <Text variant="h3" weight="bold" center style={styles.emptyTitle}>
                No Parties Yet
              </Text>
              <Text variant="body" center color="secondary" style={styles.emptyDescription}>
                Be the first to start the party!
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => router.push('/party/create')}
              >
                <Text variant="body" weight="semibold" color="accent">
                  Create Party →
                </Text>
              </TouchableOpacity>
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.primary,
    marginBottom: Spacing.xxs,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  filtersScroll: {
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  filterChipActive: {
    borderColor: Colors.primary,
  },
  filterChipGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  filterLabel: {
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    marginBottom: Spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    flex: 1,
  },

  // Proximity Circles - Perfect circles matching screenshot
  proximityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  proximityCircle: {
    width: (width - Spacing.lg * 2) / 3 - 8,
    aspectRatio: 1,
  },
  proximityCard: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    padding: 0,
  },
  proximityGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  proximityEmoji: {
    fontSize: 40,
    marginBottom: Spacing.xs,
    includeFontPadding: false,
  },
  proximityName: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: Spacing.xxs,
  },
  proximityAttendees: {
    fontSize: 11,
    marginBottom: Spacing.xxs,
  },
  proximityDistance: {
    fontSize: 10,
  },

  // Quick Actions
  quickActionsSection: {
    marginTop: -Spacing.base,
  },
  quickActionsTitle: {
    marginBottom: Spacing.base,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
  },
  quickActionCard: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  quickActionLabel: {
    fontSize: 13,
  },

  // Party Cards
  partyCard: {
    marginBottom: Spacing.md,
  },
  partyCardContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  partyImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  partyImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  partyMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  partyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  emptyAction: {
    padding: Spacing.base,
  },
  emptyText: {
    marginTop: Spacing.md,
    maxWidth: 250,
  },
});
