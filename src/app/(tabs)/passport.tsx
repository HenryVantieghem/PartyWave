import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Image,
  ImageBackground,
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
import { formatDate, formatTime } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type FilterTab = 'hosting' | 'invites' | 'joined' | 'past';

export default function PartiesScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { myParties, fetchMyParties, isLoading } = usePartyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('hosting');

  useEffect(() => {
    if (profile?.id) {
      loadParties();
    }
  }, [profile?.id]);

  const loadParties = async () => {
    if (profile?.id) {
      await fetchMyParties(profile.id);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParties();
    setRefreshing(false);
  };

  const handleFilterChange = (filter: FilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const handlePartyPress = (partyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/party/${partyId}`);
  };

  const now = new Date();

  // Filter parties based on active filter
  const displayParties = React.useMemo(() => {
    switch (activeFilter) {
      case 'hosting':
        return myParties.filter(p => p.host_id === profile?.id && p.status !== 'ended');
      case 'invites':
        return []; // TODO: Implement invites
      case 'joined':
        return myParties.filter(p => p.host_id !== profile?.id && p.status !== 'ended');
      case 'past':
        return myParties.filter(p => p.status === 'ended' || new Date(p.date_time) < now);
      default:
        return myParties;
    }
  }, [myParties, activeFilter, profile?.id]);

  const filters: { key: FilterTab; label: string; icon: string }[] = [
    { key: 'hosting', label: 'Hosting', icon: 'sparkles' },
    { key: 'invites', label: 'Invites', icon: 'mail' },
    { key: 'joined', label: 'Joined', icon: 'people' },
    { key: 'past', label: 'Past', icon: 'time' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header - REFERENCE-MATCHED */}
        <View style={styles.header}>
          <Text variant="h2" weight="black" style={styles.headerTitle}>
            Parties
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Avatar
              source={profile?.avatar_url ? { uri: profile.avatar_url } : undefined}
              size="md"
            />
          </TouchableOpacity>
        </View>

        {/* Filter Pills - REFERENCE-MATCHED */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterPill,
                activeFilter === filter.key && styles.filterPillActive,
              ]}
              onPress={() => handleFilterChange(filter.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={activeFilter === filter.key ? Colors.white : Colors.text.secondary}
              />
              <Text
                variant="body"
                weight="semibold"
                color={activeFilter === filter.key ? 'white' : 'secondary'}
                style={styles.filterText}
              >
                {filter.label}
              </Text>
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
          {/* Parties List - REFERENCE-MATCHED Card Design */}
          {isLoading && displayParties.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : displayParties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="h1" style={styles.emptyEmoji}>
                {activeFilter === 'hosting' ? '🎉' : activeFilter === 'invites' ? '✉️' : activeFilter === 'joined' ? '🎊' : '📅'}
              </Text>
              <Text variant="h3" weight="bold" center style={styles.emptyTitle}>
                No {activeFilter === 'hosting' ? 'Parties Hosted' : activeFilter === 'invites' ? 'Invites' : activeFilter === 'joined' ? 'Joined Parties' : 'Past Parties'}
              </Text>
              <Text variant="body" center color="secondary" style={styles.emptyText}>
                {activeFilter === 'hosting' && 'Start hosting and create your first party!'}
                {activeFilter === 'invites' && 'Party invites will appear here'}
                {activeFilter === 'joined' && 'Join parties to see them here'}
                {activeFilter === 'past' && 'Your party history will appear here'}
              </Text>
            </View>
          ) : (
            <View style={styles.partiesList}>
              {displayParties.map((party, index) => {
                const isHost = party.host_id === profile?.id;
                const partyDate = new Date(party.date_time);

                return (
                  <TouchableOpacity
                    key={party.id}
                    style={styles.partyCardWrapper}
                    onPress={() => handlePartyPress(party.id)}
                    activeOpacity={0.85}
                  >
                    <Card variant="liquid" style={styles.partyCard}>
                      {/* Party Image with Overlay - REFERENCE-MATCHED */}
                      <View style={styles.partyImageContainer}>
                        {party.cover_image_url ? (
                          <ImageBackground
                            source={{ uri: party.cover_image_url }}
                            style={styles.partyImage}
                            imageStyle={styles.partyImageStyle}
                          >
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.8)']}
                              style={styles.imageOverlay}
                            >
                              <View style={styles.imageOverlayContent}>
                                {/* Host Info */}
                                <View style={styles.hostInfo}>
                                  <Avatar
                                    source={party.host?.avatar_url ? { uri: party.host.avatar_url } : undefined}
                                    size="xs"
                                  />
                                  <Text variant="caption" color="white" style={styles.hostedByText}>
                                    Hosted by {party.host?.display_name || 'Unknown'}
                                  </Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </ImageBackground>
                        ) : (
                          <View style={styles.partyImage}>
                            <LinearGradient
                              colors={index % 3 === 0 ? Gradients.primary : index % 3 === 1 ? Gradients.secondary : Gradients.fire}
                              style={StyleSheet.absoluteFill}
                            >
                              <Text style={styles.partyPlaceholderEmoji}>
                                {index % 4 === 0 ? '🎉' : index % 4 === 1 ? '🎊' : index % 4 === 2 ? '🎈' : '🎆'}
                              </Text>
                            </LinearGradient>
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.8)']}
                              style={styles.imageOverlay}
                            >
                              <View style={styles.imageOverlayContent}>
                                {/* Host Info */}
                                <View style={styles.hostInfo}>
                                  <Avatar
                                    source={party.host?.avatar_url ? { uri: party.host.avatar_url } : undefined}
                                    size="xs"
                                  />
                                  <Text variant="caption" color="white" style={styles.hostedByText}>
                                    Hosted by {party.host?.display_name || 'Unknown'}
                                  </Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </View>
                        )}
                      </View>

                      {/* Party Details - REFERENCE-MATCHED */}
                      <View style={styles.partyDetails}>
                        <Text variant="h4" weight="bold" numberOfLines={1} style={styles.partyTitle}>
                          {party.name}
                        </Text>

                        {/* Meta Info Row */}
                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color={Colors.text.secondary} />
                            <Text variant="caption" color="secondary">
                              {formatDate(party.date_time)}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                            <Text variant="caption" color="secondary">
                              {formatTime(party.date_time)}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
                            <Text variant="caption" color="secondary" numberOfLines={1} style={{ flex: 1 }}>
                              {party.location_name.length > 15 ? party.location_name.substring(0, 15) + '...' : party.location_name}
                            </Text>
                          </View>
                        </View>

                        {/* Footer Row - Attendees + Join Button */}
                        <View style={styles.footerRow}>
                          <View style={styles.attendeesInfo}>
                            <Ionicons name="people" size={16} color={Colors.text.secondary} />
                            <Text variant="caption" color="secondary">
                              2 going
                            </Text>
                          </View>

                          {!isHost && (
                            <TouchableOpacity
                              style={styles.joinButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                // TODO: Implement join party
                              }}
                            >
                              <Text variant="caption" weight="bold" color="white">
                                Join
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
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
  // Header - REFERENCE-MATCHED
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
  // Filter Pills - REFERENCE-MATCHED
  filtersScroll: {
    marginBottom: Spacing.lg,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginRight: Spacing.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    maxWidth: 280,
  },
  // Party Cards - REFERENCE-MATCHED
  partiesList: {
    gap: Spacing.base,
  },
  partyCardWrapper: {
    marginBottom: Spacing.base,
  },
  partyCard: {
    padding: 0,
    overflow: 'hidden',
  },
  partyImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  partyImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyImageStyle: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  partyPlaceholderEmoji: {
    fontSize: 80,
    position: 'absolute',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  imageOverlayContent: {
    padding: Spacing.base,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hostedByText: {
    fontSize: 13,
  },
  partyDetails: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  partyTitle: {
    fontSize: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
