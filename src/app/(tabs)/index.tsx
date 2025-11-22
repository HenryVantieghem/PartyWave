import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
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
import { getCurrentLocation, sortPartiesByDistance, formatDistance, type Coordinates } from '@/lib/location';

const { width } = Dimensions.get('window');

// 🔥 ANIMATED PROXIMITY CIRCLE - The secret sauce
const AnimatedProximityCircle = ({ party, onPress, index }: any) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const emojiAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing animation - makes the circle BREATHE
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200 + index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200 + index * 150,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation - energy radiating
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800 + index * 200,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800 + index * 200,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Emoji bounce - playful energy
    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiAnim, {
          toValue: 1.15,
          duration: 800 + index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(emojiAnim, {
          toValue: 1,
          duration: 800 + index * 100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Energy level based on attendees
  const energy = party.attendees > 25 ? 'high' : party.attendees > 12 ? 'medium' : 'low';
  const energyColor =
    energy === 'high' ? Colors.live : energy === 'medium' ? Colors.accent.orange : Colors.secondary;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.proximityCircle,
        {
          transform: [{ scale: index === 1 ? 1.05 : pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        activeOpacity={0.85}
      >
        {/* Outer glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowOpacity,
              shadowColor: energyColor,
              shadowRadius: 25,
              shadowOpacity: 0.6,
            },
          ]}
        />

        <Card variant="liquid" style={styles.proximityCard}>
          <LinearGradient
            colors={
              energy === 'high'
                ? ['rgba(0, 255, 148, 0.3)', 'rgba(0, 255, 148, 0.05)']
                : energy === 'medium'
                ? ['rgba(251, 146, 60, 0.3)', 'rgba(251, 146, 60, 0.05)']
                : ['rgba(78, 205, 196, 0.25)', 'rgba(78, 205, 196, 0.05)']
            }
            style={styles.proximityGradient}
          >
            {/* Energy ring indicator */}
            <View style={[styles.energyRing, { borderColor: energyColor }]} />

            {/* Live indicator for hot parties */}
            {energy === 'high' && (
              <View style={styles.liveTag}>
                <Animated.View
                  style={[
                    styles.liveDot,
                    {
                      opacity: glowAnim,
                      backgroundColor: Colors.live,
                    },
                  ]}
                />
                <Text variant="label" color="white" style={styles.liveText}>
                  LIVE
                </Text>
              </View>
            )}

            {/* Animated emoji */}
            <Animated.Text
              style={[
                styles.proximityEmoji,
                {
                  transform: [{ scale: emojiAnim }],
                },
              ]}
            >
              {party.emoji}
            </Animated.Text>

            <Text variant="body" weight="bold" center style={styles.proximityName}>
              {party.name}
            </Text>

            {/* Attendees with icon */}
            <View style={styles.attendeesRow}>
              <Ionicons name="people" size={13} color={energyColor} />
              <Text
                variant="caption"
                weight="semibold"
                style={[styles.attendeesText, { color: energyColor }]}
              >
                {party.attendees} going
              </Text>
            </View>

            {/* Distance */}
            <Text variant="caption" color="tertiary" center style={styles.proximityDistance}>
              📍 {party.distance}
            </Text>

            {/* Friends going overlay - SOCIAL PROOF! */}
            {party.friendsGoing && party.friendsGoing.length > 0 && (
              <View style={styles.friendsOverlay}>
                <View style={styles.friendAvatarsRow}>
                  {party.friendsGoing.slice(0, 3).map((friend: any, i: number) => (
                    <View
                      key={i}
                      style={[
                        styles.tinyAvatar,
                        {
                          marginLeft: i === 0 ? 0 : -8,
                          zIndex: 10 - i,
                          backgroundColor: Colors.primary,
                          borderColor: Colors.background,
                        },
                      ]}
                    />
                  ))}
                  {party.friendsGoing.length > 3 && (
                    <View style={[styles.tinyAvatar, { marginLeft: -8, backgroundColor: Colors.card }]}>
                      <Text variant="label" style={{ fontSize: 8 }}>
                        +{party.friendsGoing.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function DiscoverScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { parties, fetchParties, isLoading } = usePartyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    fetchParties({ status: 'upcoming' });
    loadUserLocation();
  }, []);

  const loadUserLocation = async () => {
    setLoadingLocation(true);
    const location = await getCurrentLocation();
    if (location) {
      setUserLocation(location);
    }
    setLoadingLocation(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchParties({ status: 'upcoming' }),
      loadUserLocation(),
    ]);
    setRefreshing(false);
  };

  // Get parties sorted by distance from user's location
  const nearbyParties = React.useMemo(() => {
    if (!userLocation || !parties.length) {
      // Return empty array - will show empty state
      return [];
    }

    // Sort actual parties by distance
    const sortedParties = sortPartiesByDistance(parties, userLocation);

    // Map to proximity circle format and take top 5
    return sortedParties.slice(0, 5).map((party) => ({
      id: party.id,
      name: party.name.replace(/ /g, '\n'), // Add line breaks for better display
      distance: formatDistance(party.distance),
      attendees: 0, // TODO: Get actual attendee count from party_attendees
      emoji: '🎉', // Default emoji, could be dynamic based on party type
      friendsGoing: [], // TODO: Get friends attending from connections + party_attendees
    }));
  }, [parties, userLocation]);

  // Quick actions - REFERENCE-MATCHED
  const quickActions = [
    {
      icon: 'sparkles',
      label: 'Start Party',
      color: Colors.primary,
      emoji: '🎉',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push('/party/create');
      },
    },
    {
      icon: 'people',
      label: 'Invite Crew',
      color: Colors.secondary,
      emoji: '👥',
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push('/(tabs)/crew');
      },
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header - REFERENCE-MATCHED */}
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
            <Ionicons name="sparkles" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* Live Right Now Section - REFERENCE-MATCHED */}
          {nearbyParties.filter(p => p.attendees > 20).length > 0 && (
            <View style={[styles.section, { marginBottom: Spacing.xl }]}>
              <View style={styles.liveNowHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveIndicatorDotLarge} />
                  <Text variant="body" weight="bold">
                    Live Right Now
                  </Text>
                </View>
                <Text variant="caption" color="secondary">
                  {nearbyParties.filter(p => p.attendees > 20).length} parties
                </Text>
              </View>

              {nearbyParties.filter(p => p.attendees > 20).slice(0, 1).map((party) => (
                <TouchableOpacity
                  key={party.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/party/${party.id}`);
                  }}
                  style={styles.livePartyCard}
                  activeOpacity={0.85}
                >
                  <Card variant="liquid">
                    <View style={styles.livePartyContent}>
                      <View style={styles.livePartyInfo}>
                        <Text variant="body" weight="bold" numberOfLines={1}>
                          {party.name.replace(/\n/g, ' ')}
                        </Text>
                        <View style={styles.livePartyMeta}>
                          <Text variant="caption" color="secondary">
                            {party.attendees} people
                          </Text>
                          <Text variant="caption" color="secondary"> • </Text>
                          <Text variant="caption" style={{ color: Colors.primary, fontWeight: '600' }}>
                            Energy: 99%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Near You Section - ANIMATED PROXIMITY CIRCLES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                Near You {userLocation && !loadingLocation && '📍'}
              </Text>
              {loadingLocation && <ActivityIndicator size="small" color={Colors.primary} />}
              {!loadingLocation && nearbyParties.length > 0 && (
                <>
                  <View style={styles.liveIndicatorDot} />
                  <Text variant="caption" color="success" weight="semibold">
                    {nearbyParties.length} LIVE
                  </Text>
                </>
              )}
            </View>

            {loadingLocation ? (
              <View style={styles.loadingLocationContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text variant="body" color="secondary" style={{ marginTop: Spacing.md }}>
                  Finding parties near you...
                </Text>
              </View>
            ) : (
              <View style={styles.proximityContainer}>
                {nearbyParties.map((party, index) => (
                  <AnimatedProximityCircle
                    key={party.id}
                    party={party}
                    index={index}
                    onPress={() => router.push(`/party/${party.id}` as any)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions - REFERENCE-MATCHED */}
          <View style={[styles.section, styles.quickActionsSection]}>
            <Text variant="body" weight="bold" style={styles.quickActionsTitle}>
              Quick Actions
            </Text>

            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickAction}
                  onPress={action.action}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionContent}>
                    <View style={[styles.quickActionIcon, { backgroundColor: Colors.card }]}>
                      <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
                    </View>
                    <Text variant="caption" weight="semibold" center style={styles.quickActionLabel}>
                      {action.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trending Parties - ENHANCED with Social Proof */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flame" size={20} color={Colors.accent.orange} />
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                Hot Right Now 🔥
              </Text>
            </View>

            {parties.slice(0, 4).map((party, index) => (
              <TouchableOpacity
                key={party.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/party/${party.id}`);
                }}
                style={styles.partyCard}
                activeOpacity={0.85}
              >
                <Card variant="liquid">
                  <View style={styles.partyCardContent}>
                    {/* Party Image with Gradient Overlay */}
                    {party.cover_image_url ? (
                      <View style={styles.partyImage} />
                    ) : (
                      <LinearGradient
                        colors={index % 3 === 0 ? Gradients.fire : index % 3 === 1 ? Gradients.electric : Gradients.candy}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.partyImagePlaceholder}
                      >
                        <Text variant="h1" style={styles.partyImageEmoji}>
                          {index % 4 === 0 ? '🎉' : index % 4 === 1 ? '🎊' : index % 4 === 2 ? '🎈' : '🎆'}
                        </Text>
                      </LinearGradient>
                    )}

                    {/* Party Info */}
                    <View style={styles.partyInfo}>
                      <View style={styles.partyTitleRow}>
                        <Text variant="body" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                          {party.name}
                        </Text>
                        {index === 0 && (
                          <View style={styles.hotBadge}>
                            <Text variant="label" style={styles.hotBadgeText}>HOT</Text>
                          </View>
                        )}
                      </View>
                      <Text variant="caption" color="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
                        📍 {party.location_name}
                      </Text>

                      <View style={styles.partyMeta}>
                        <View style={styles.partyMetaItem}>
                          <Ionicons name="people" size={14} color={Colors.live} />
                          <Text variant="caption" style={{ color: Colors.live, fontWeight: '600' }}>
                            {24 + index * 8} going
                          </Text>
                        </View>
                        <View style={styles.partyMetaItem}>
                          <Ionicons name="eye" size={14} color={Colors.text.tertiary} />
                          <Text variant="caption" color="tertiary">
                            {120 + index * 50} views
                          </Text>
                        </View>
                        <View style={styles.partyMetaItem}>
                          <Ionicons name="flame" size={14} color={Colors.accent.orange} />
                          <Text variant="caption" style={{ color: Colors.accent.orange, fontWeight: '600' }}>
                            {party.energy_score}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Empty state */}
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
              <TouchableOpacity style={styles.emptyAction} onPress={() => router.push('/party/create')}>
                <Text variant="body" weight="semibold" color="accent">
                  Create Party →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Floating Quick Create Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/party/quick-create');
          }}
          activeOpacity={0.9}
        >
          <LinearGradient colors={Gradients.party} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
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
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.live,
    marginRight: 4,
  },
  liveIndicatorDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: Spacing.sm,
  },
  liveNowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePartyCard: {
    marginBottom: Spacing.sm,
  },
  livePartyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePartyInfo: {
    flex: 1,
  },
  livePartyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },

  // 🔥 Animated Proximity Circles
  proximityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingLocationContainer: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  proximityCircle: {
    width: (width - Spacing.lg * 2) / 3 - 8,
    aspectRatio: 1,
  },
  glowRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
    position: 'relative',
  },
  energyRing: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.5,
  },
  liveTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 148, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.live,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  proximityEmoji: {
    fontSize: 40,
    marginBottom: Spacing.xs,
    includeFontPadding: false,
  },
  proximityName: {
    fontSize: 11,
    lineHeight: 13,
    marginBottom: 4,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  attendeesText: {
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '600',
  },
  proximityDistance: {
    fontSize: 9,
  },
  friendsOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  friendAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tinyAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Actions - REFERENCE-MATCHED
  quickActionsSection: {
    marginTop: -Spacing.base,
  },
  quickActionsTitle: {
    marginBottom: Spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    justifyContent: 'center',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  quickActionEmoji: {
    fontSize: 36,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
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
  partyImageEmoji: {
    fontSize: 36,
  },
  partyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  partyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hotBadge: {
    backgroundColor: Colors.accent.orange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  hotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
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

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
