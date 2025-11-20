import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
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
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function PassportScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { myParties, fetchMyParties, isLoading } = usePartyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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

  const handleTabChange = (tab: 'upcoming' | 'past') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handlePartyPress = (partyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/party/${partyId}`);
  };

  const handleCreateParty = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/party/create');
  };

  const now = new Date();
  const upcomingParties = myParties.filter(
    (party) => new Date(party.date_time) >= now && party.status !== 'ended'
  );
  const pastParties = myParties.filter(
    (party) => new Date(party.date_time) < now || party.status === 'ended'
  );

  const displayParties = activeTab === 'upcoming' ? upcomingParties : pastParties;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="h2" weight="black" style={styles.headerTitle}>
              My Parties
            </Text>
            <Text variant="caption" color="secondary">
              Manage your party schedule
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateParty}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
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
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
              onPress={() => handleTabChange('upcoming')}
            >
              <Text
                variant="body"
                weight="semibold"
                color={activeTab === 'upcoming' ? 'white' : 'secondary'}
              >
                Upcoming ({upcomingParties.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.tabActive]}
              onPress={() => handleTabChange('past')}
            >
              <Text
                variant="body"
                weight="semibold"
                color={activeTab === 'past' ? 'white' : 'secondary'}
              >
                Past ({pastParties.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Parties List */}
          {isLoading && displayParties.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : displayParties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
                size={64}
                color={Colors.text.tertiary}
              />
              <Text variant="h3" weight="bold" center style={styles.emptyTitle}>
                {activeTab === 'upcoming' ? 'No Upcoming Parties' : 'No Past Parties'}
              </Text>
              <Text variant="body" center color="secondary" style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? 'Create your first party and start the fun!'
                  : 'Your past party memories will appear here'}
              </Text>
              {activeTab === 'upcoming' && (
                <Button
                  onPress={handleCreateParty}
                  variant="primary"
                  size="large"
                  fullWidth
                  gradient
                  style={styles.emptyButton}
                >
                  Create Party
                </Button>
              )}
            </View>
          ) : (
            <View style={styles.partiesList}>
              {displayParties.map((party) => {
                const isHost = party.host_id === profile?.id;
                const partyDate = new Date(party.date_time);
                const isToday = partyDate.toDateString() === now.toDateString();
                const isHappening = party.status === 'happening';

                return (
                  <TouchableOpacity
                    key={party.id}
                    style={styles.partyCard}
                    onPress={() => handlePartyPress(party.id)}
                  >
                    <Card variant="glass" style={styles.card}>
                      <View style={styles.partyContent}>
                        {/* Party Image/Emoji */}
                        {party.cover_image_url ? (
                          <View style={styles.partyImage} />
                        ) : (
                          <LinearGradient
                            colors={isHost ? Gradients.primary : Gradients.secondary}
                            style={styles.partyImagePlaceholder}
                          >
                            <Text variant="h1" style={styles.partyEmoji}>
                              {isHost ? '🎉' : '🎊'}
                            </Text>
                          </LinearGradient>
                        )}

                        {/* Party Info */}
                        <View style={styles.partyInfo}>
                          <View style={styles.partyHeader}>
                            <View style={styles.partyTitleRow}>
                              <Text variant="body" weight="bold" numberOfLines={1} style={styles.partyName}>
                                {party.name}
                              </Text>
                              {isHappening && (
                                <View style={styles.liveBadge}>
                                  <View style={styles.liveDot} />
                                  <Text variant="label" color="white" style={styles.liveText}>
                                    LIVE
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={[styles.roleBadge, { backgroundColor: isHost ? Colors.primary : Colors.secondary }]}>
                              <Text variant="label" color="white" style={styles.roleText}>
                                {isHost ? 'HOST' : 'GUEST'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.partyMeta}>
                            <View style={styles.metaItem}>
                              <Ionicons name="location" size={14} color={Colors.text.tertiary} />
                              <Text variant="caption" color="tertiary" numberOfLines={1}>
                                {party.location_name}
                              </Text>
                            </View>
                            <View style={styles.metaItem}>
                              <Ionicons name="time" size={14} color={Colors.text.tertiary} />
                              <Text variant="caption" color="tertiary">
                                {isToday ? 'Today' : formatDateTime(party.date_time)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.partyFooter}>
                            <View style={styles.footerItem}>
                              <Ionicons name="people" size={16} color={Colors.text.secondary} />
                              <Text variant="caption" color="secondary">
                                {party.max_attendees ? `${party.max_attendees} max` : 'Unlimited'}
                              </Text>
                            </View>
                            <View style={styles.footerItem}>
                              <Ionicons name="flame" size={16} color={Colors.accent.orange} />
                              <Text variant="caption" color="secondary">
                                {party.energy_score}% energy
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
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
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.primary,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
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
  loadingContainer: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyText: {
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    maxWidth: 200,
  },
  partiesList: {
    gap: Spacing.md,
  },
  partyCard: {
    marginBottom: Spacing.md,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  partyContent: {
    flexDirection: 'row',
  },
  partyImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.surface,
  },
  partyImagePlaceholder: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyEmoji: {
    fontSize: 40,
  },
  partyInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  partyHeader: {
    marginBottom: Spacing.sm,
  },
  partyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  partyName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.live,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
  },
  partyMeta: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  partyFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
