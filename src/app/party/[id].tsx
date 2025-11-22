import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, Layout, BorderRadius, Shadows } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, formatTime } from '@/lib/utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.4;

export default function PartyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    currentParty,
    attendees,
    coHosts,
    isLoading,
    fetchPartyById,
    fetchAttendees,
    fetchCoHosts,
    joinParty,
    checkIn
  } = usePartyStore();
  const { profile } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const partyCoHosts = id ? coHosts[id] || [] : [];

  useEffect(() => {
    if (id) {
      loadPartyDetails();
    }
  }, [id]);

  const loadPartyDetails = async () => {
    if (!id) return;
    await fetchPartyById(id);
    await fetchAttendees(id);
    await fetchCoHosts(id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPartyDetails();
    setRefreshing(false);
  };

  const handleJoin = async () => {
    if (!id || !profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await joinParty(id, profile.id);
  };

  const handleCheckIn = async () => {
    if (!id || !profile?.id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await checkIn(id, profile.id);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!currentParty) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.loadingContainer}>
          <Text variant="h3" center>Loading...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const isHost = currentParty.host_id === profile?.id;
  const isAttending = attendees.some((a) => a.user_id === profile?.id);
  const isCheckedIn = attendees.find((a) => a.user_id === profile?.id)?.status === 'checked_in';

  // Calculate header opacity based on scroll
  const headerOpacity = Math.max(0, Math.min(1, scrollY / 100));

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <BlurView intensity={80} tint="dark" style={[styles.fixedHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text variant="h4" weight="bold" numberOfLines={1} style={styles.headerTitle}>
              {currentParty.name}
            </Text>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Parallax Header Image */}
        <View style={styles.headerImageContainer}>
          {currentParty.cover_image_url ? (
            <Image
              source={{ uri: currentParty.cover_image_url }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient colors={Gradients.party} style={styles.headerImage} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', Colors.background]}
            style={styles.headerGradient}
          />

          {/* Floating Back Button */}
          <SafeAreaView edges={['top']} style={styles.floatingHeaderContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.floatingBackButton}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Live Indicator */}
          {currentParty.status === 'happening' && (
            <View style={styles.liveIndicator}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.liveDot} />
              <Text variant="caption" weight="bold" color="white">
                LIVE NOW
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Party Info Card */}
          <Card variant="liquid" style={{ marginBottom: Spacing.base }}>
            <Text variant="h2" weight="bold" style={styles.partyName}>
              {currentParty.name}
            </Text>

              {/* Energy Meter */}
              <View style={styles.energyContainer}>
                <Text variant="caption" color="secondary" style={styles.energyLabel}>
                  PARTY ENERGY
                </Text>
                <View style={styles.energyBar}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FFD93D', '#00FF94']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.energyFill, { width: `${currentParty.energy_score || 75}%` }]}
                  />
                </View>
                <Text variant="h4" weight="bold" color="primary">
                  {currentParty.energy_score || 75}%
                </Text>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={20} color={Colors.secondary} />
                  <Text variant="body" weight="semibold" style={styles.statText}>
                    {attendees.length}/{currentParty.max_attendees || '∞'}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="location" size={20} color={Colors.accent.purple} />
                  <Text variant="body" weight="semibold" style={styles.statText}>
                    0.4 mi
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="star" size={20} color={Colors.accent.gold} />
                  <Text variant="body" weight="semibold" style={styles.statText}>
                    4.9
                  </Text>
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar" size={20} color={Colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text variant="caption" color="secondary">
                    Date & Time
                  </Text>
                  <Text variant="body" weight="semibold">
                    {formatDate(currentParty.date_time)} at {formatTime(currentParty.date_time)}
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location" size={20} color={Colors.secondary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text variant="caption" color="secondary">
                    Location
                  </Text>
                  <Text variant="body" weight="semibold">
                    {currentParty.location_name || 'Location TBA'}
                  </Text>
                </View>
              </View>

              {/* Description */}
              {currentParty.description && (
                <View style={styles.descriptionContainer}>
                  <Text variant="body" color="secondary" style={styles.description}>
                    {currentParty.description}
                  </Text>
                </View>
              )}
          </Card>

          {/* Host Card */}
          <View style={styles.sectionHeader}>
            <Text variant="h4" weight="bold">
              Hosted By
            </Text>
          </View>
          <Card variant="liquid">
            <View style={styles.hostCard}>
              <Avatar
                source={{ uri: currentParty.host?.avatar_url }}
                size="lg"
                fallbackText={currentParty.host?.display_name}
              />
              <View style={styles.hostInfo}>
                <Text variant="h4" weight="bold">
                  {currentParty.host?.display_name}
                </Text>
                <Text variant="caption" color="secondary">
                  @{currentParty.host?.username}
                </Text>
                <View style={styles.hostStats}>
                  <Text variant="caption" color="secondary">
                    🎉 {currentParty.host?.total_parties_hosted || 0} parties hosted
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Ionicons name="person-add" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Attendees Section */}
          <View style={styles.sectionHeader}>
            <Text variant="h4" weight="bold">
              Going ({attendees.length})
            </Text>
          </View>
          <Card variant="liquid">
              {attendees.slice(0, 8).map((attendee, index) => (
                <View key={attendee.id} style={styles.attendeeRow}>
                  <Avatar
                    source={{ uri: attendee.user?.avatar_url }}
                    size="md"
                    fallbackText={attendee.user?.display_name}
                    online={attendee.status === 'checked_in'}
                  />
                  <View style={styles.attendeeInfo}>
                    <Text variant="body" weight="semibold">
                      {attendee.user?.display_name}
                    </Text>
                    <Text variant="caption" color="secondary">
                      @{attendee.user?.username}
                    </Text>
                  </View>
                  {attendee.status === 'checked_in' && (
                    <View style={styles.checkedInBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text variant="caption" weight="semibold" color="success">
                        Here
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {attendees.length > 8 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text variant="body" weight="semibold" color="primary">
                    View All {attendees.length} Attendees
                  </Text>
                </TouchableOpacity>
              )}
          </Card>

          {/* Bottom spacing for button */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomContainer}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['bottom']} style={styles.actionContainer}>
          {isHost ? (
            <Button variant="primary" gradient onPress={() => router.push(`/party/edit/${id}`)}>
              <Ionicons name="settings" size={20} color={Colors.white} />
              <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                Manage Party
              </Text>
            </Button>
          ) : !isAttending ? (
            <Button variant="primary" gradient onPress={handleJoin} loading={isLoading}>
              <Ionicons name="add-circle" size={20} color={Colors.white} />
              <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                Join Party
              </Text>
            </Button>
          ) : !isCheckedIn ? (
            <Button variant="secondary" gradient onPress={handleCheckIn} loading={isLoading}>
              <Ionicons name="qr-code" size={20} color={Colors.white} />
              <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                Check In
              </Text>
            </Button>
          ) : (
            <View style={styles.checkedInContainer}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text variant="h4" weight="bold" color="success" style={{ marginLeft: Spacing.sm }}>
                You're Checked In! 🎉
              </Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
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
  headerTitle: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  headerImageContainer: {
    width: SCREEN_WIDTH,
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT * 0.5,
  },
  floatingHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  floatingBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  liveIndicator: {
    position: 'absolute',
    top: 60,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.live,
    marginRight: Spacing.xs,
  },
  content: {
    padding: Spacing.base,
    marginTop: -40,
  },
  glassCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glass.border,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  cardContent: {
    padding: Spacing.lg,
  },
  partyName: {
    marginBottom: Spacing.base,
  },
  energyContainer: {
    marginBottom: Spacing.lg,
  },
  energyLabel: {
    marginBottom: Spacing.xs,
  },
  energyBar: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  energyFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.base,
    marginBottom: Spacing.base,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    marginLeft: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border.default,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  descriptionContainer: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
  description: {
    lineHeight: 22,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  hostInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  hostStats: {
    marginTop: Spacing.xs,
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  attendeeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.sm,
  },
  viewAllButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
    marginTop: Spacing.sm,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
  actionContainer: {
    padding: Spacing.base,
  },
  checkedInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
  },
});
