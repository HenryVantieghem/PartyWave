import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function QuickPlansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const crewId = params.id as string;

  const { profile } = useAuthStore();
  const { quickPlans, fetchQuickPlans, voteOnQuickPlan, confirmQuickPlan } = usePartyStore();

  const [refreshing, setRefreshing] = useState(false);

  const crewQuickPlans = crewId ? quickPlans[crewId] || [] : [];

  useEffect(() => {
    if (crewId) {
      fetchQuickPlans(crewId);
    }
  }, [crewId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuickPlans(crewId);
    setRefreshing(false);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleVote = async (planId: string, voteType: 'up' | 'down' | 'interested') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await voteOnQuickPlan({ quick_plan_id: planId, vote_type: voteType });
  };

  const handleConfirm = (planId: string) => {
    Alert.alert(
      'Confirm Quick Plan',
      'Convert this quick plan into a real party?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Party',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const plan = crewQuickPlans.find((p) => p.id === planId);
            if (!plan) return;

            try {
              await confirmQuickPlan(planId, {
                name: plan.title,
                description: plan.description || undefined,
                date_time: plan.suggested_time || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                location_name: plan.suggested_location || 'TBA',
                creation_mode: 'quick',
                vibe_tags: ['spontaneous'],
              });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success!', 'Quick plan converted to party', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.message || 'Failed to create party');
            }
          },
        },
      ]
    );
  };

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
              Quick Plans
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/crew/${crewId}/create-quick-plan` as any)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {crewQuickPlans.length === 0 ? (
          <Card variant="liquid" style={{ marginTop: Spacing.xl }}>
            <View style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={64} color={Colors.text.tertiary} />
              <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
                No Quick Plans
              </Text>
              <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                Start a poll to see what the crew wants to do!
              </Text>
              <Button
                variant="primary"
                gradient
                onPress={() => router.push(`/crew/${crewId}/create-quick-plan` as any)}
                style={{ marginTop: Spacing.lg }}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                  Create Quick Plan
                </Text>
              </Button>
            </View>
          </Card>
        ) : (
          crewQuickPlans.map((plan) => {
            const userVote = plan.user_vote;
            const isCreator = plan.created_by === profile?.id;
            const timeRemaining = formatDistanceToNow(new Date(plan.expires_at), { addSuffix: true });

            return (
              <Card key={plan.id} variant="liquid" style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text variant="h4" weight="bold">
                    {plan.title}
                  </Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text variant="caption" weight="semibold" color="white">
                      {plan.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {plan.description && (
                  <Text variant="body" color="secondary" style={{ marginTop: Spacing.sm }}>
                    {plan.description}
                  </Text>
                )}

                {(plan.suggested_time || plan.suggested_location) && (
                  <View style={styles.planDetails}>
                    {plan.suggested_time && (
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                        <Text variant="caption" color="secondary" style={{ marginLeft: Spacing.xs }}>
                          {new Date(plan.suggested_time).toLocaleString()}
                        </Text>
                      </View>
                    )}
                    {plan.suggested_location && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
                        <Text variant="caption" color="secondary" style={{ marginLeft: Spacing.xs }}>
                          {plan.suggested_location}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Voting */}
                <View style={styles.votingSection}>
                  <TouchableOpacity
                    onPress={() => handleVote(plan.id, 'up')}
                    style={[styles.voteButton, userVote?.vote_type === 'up' && styles.voteButtonActive]}
                  >
                    <Ionicons
                      name={userVote?.vote_type === 'up' ? 'arrow-up' : 'arrow-up-outline'}
                      size={24}
                      color={userVote?.vote_type === 'up' ? Colors.white : Colors.text.secondary}
                    />
                    <Text
                      variant="body"
                      weight="semibold"
                      color={userVote?.vote_type === 'up' ? 'white' : 'secondary'}
                      style={{ marginLeft: Spacing.xs }}
                    >
                      {plan.upvotes}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleVote(plan.id, 'interested')}
                    style={[
                      styles.voteButton,
                      styles.voteButtonInterested,
                      userVote?.vote_type === 'interested' && styles.voteButtonInterestedActive,
                    ]}
                  >
                    <Ionicons
                      name={userVote?.vote_type === 'interested' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={20}
                      color={userVote?.vote_type === 'interested' ? Colors.white : Colors.accent.blue}
                    />
                    <Text
                      variant="caption"
                      weight="semibold"
                      color={userVote?.vote_type === 'interested' ? 'white' : 'secondary'}
                      style={{ marginLeft: Spacing.xs }}
                    >
                      I'm in
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleVote(plan.id, 'down')}
                    style={[styles.voteButton, userVote?.vote_type === 'down' && styles.voteButtonDownActive]}
                  >
                    <Ionicons
                      name={userVote?.vote_type === 'down' ? 'arrow-down' : 'arrow-down-outline'}
                      size={24}
                      color={userVote?.vote_type === 'down' ? Colors.white : Colors.text.secondary}
                    />
                    <Text
                      variant="body"
                      weight="semibold"
                      color={userVote?.vote_type === 'down' ? 'white' : 'secondary'}
                      style={{ marginLeft: Spacing.xs }}
                    >
                      {plan.downvotes}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Confirm Button for Creator */}
                {isCreator && plan.status === 'active' && plan.upvotes > plan.downvotes && (
                  <TouchableOpacity onPress={() => handleConfirm(plan.id)} style={styles.confirmButton}>
                    <LinearGradient colors={Gradients.party} style={styles.confirmGradient}>
                      <Ionicons name="rocket" size={18} color={Colors.white} />
                      <Text variant="body" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                        Make It Happen
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Footer */}
                <View style={styles.planFooter}>
                  <Text variant="caption" color="tertiary">
                    Expires {timeRemaining}
                  </Text>
                  <Text variant="caption" color="tertiary">
                    {plan.upvote_count + plan.interested_count} interested
                  </Text>
                </View>
              </Card>
            );
          })
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  planCard: {
    marginBottom: Spacing.base,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.accent.green,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  planDetails: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votingSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voteButtonActive: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  voteButtonDownActive: {
    backgroundColor: Colors.accent.orange,
    borderColor: Colors.accent.orange,
  },
  voteButtonInterested: {
    flex: 1,
  },
  voteButtonInterestedActive: {
    backgroundColor: Colors.accent.blue,
    borderColor: Colors.accent.blue,
  },
  confirmButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
});
