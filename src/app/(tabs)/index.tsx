import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
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

  useEffect(() => {
    fetchParties({ status: 'upcoming' });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParties({ status: 'upcoming' });
    setRefreshing(false);
  };

  // Mock nearby parties for proximity circles
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

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="h2" weight="black" style={styles.headerTitle}>
              Party Radar
            </Text>
            <Text variant="caption" color="secondary">
              Discover live parties near you
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Avatar source={profile?.avatar_url} name={profile?.display_name} size="md" online />
          </TouchableOpacity>
        </View>

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
                  <LinearGradient
                    colors={['rgba(255, 107, 107, 0.15)', 'rgba(255, 107, 107, 0.05)']}
                    style={styles.proximityGradient}
                  >
                    <Text variant="h1" style={styles.proximityEmoji}>
                      {party.emoji}
                    </Text>
                    <Text variant="body" weight="bold" center style={styles.proximityName}>
                      {party.name}
                    </Text>
                    <Text variant="caption" color="secondary" center>
                      {party.attendees} going
                    </Text>
                    <Text variant="caption" color="tertiary" center style={styles.proximityDistance}>
                      {party.distance}
                    </Text>
                  </LinearGradient>
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
                  <Card variant="glass" style={styles.quickActionCard}>
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
                Trending Now
              </Text>
            </View>

            {parties.slice(0, 3).map((party) => (
              <TouchableOpacity
                key={party.id}
                onPress={() => router.push(`/party/${party.id}`)}
                style={styles.partyCard}
              >
                <Card variant="glass">
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
            ))}
          </View>

          {/* Empty state if no parties */}
          {parties.length === 0 && !isLoading && (
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

  // Proximity Circles
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
  proximityGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  proximityEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  proximityName: {
    fontSize: 11,
    lineHeight: 14,
  },
  proximityDistance: {
    marginTop: Spacing.xxs,
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
});
