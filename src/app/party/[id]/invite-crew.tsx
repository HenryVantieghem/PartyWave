import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useCrewStore } from '@/stores/crewStore';
import { useAuthStore } from '@/stores/authStore';

export default function InviteCrewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const partyId = params.id as string;

  const { profile } = useAuthStore();
  const { parties, attendees } = usePartyStore();
  const { myCrews, crewMembers, fetchMyCrews, fetchCrewMembers } = useCrewStore();

  const party = parties.find((p) => p.id === partyId);
  const partyAttendees = attendees;

  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchMyCrews();
  }, []);

  useEffect(() => {
    if (selectedCrewId) {
      fetchCrewMembers(selectedCrewId);
    }
  }, [selectedCrewId]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleInviteCrew = async () => {
    if (!selectedCrewId || !partyId) return;

    const crew = myCrews.find((c) => c.id === selectedCrewId);
    const members = crewMembers[selectedCrewId] || [];

    // Filter out members who are already attending
    const membersToInvite = members.filter(
      (member) => !partyAttendees.some((attendee) => attendee.user_id === member.user_id)
    );

    if (membersToInvite.length === 0) {
      Alert.alert('All Invited', 'All crew members are already invited to this party');
      return;
    }

    Alert.alert(
      'Confirm Bulk Invite',
      `Invite ${membersToInvite.length} member${membersToInvite.length > 1 ? 's' : ''} from ${crew?.name} to this party?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Invite',
          onPress: async () => {
            try {
              setInviting(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              // Import supabase and create invitations
              const { supabase } = await import('@/lib/supabase');

              const invitations = membersToInvite.map((member) => ({
                party_id: partyId,
                user_id: member.user_id,
                invited_by: profile?.id,
                status: 'pending' as const,
              }));

              const { error } = await supabase.from('party_attendees').insert(invitations);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Success',
                `Invited ${membersToInvite.length} member${membersToInvite.length > 1 ? 's' : ''} to the party!`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.message || 'Failed to send invitations');
            } finally {
              setInviting(false);
            }
          },
        },
      ]
    );
  };

  const selectedCrew = myCrews.find((c) => c.id === selectedCrewId);
  const selectedMembers = selectedCrewId ? crewMembers[selectedCrewId] || [] : [];
  const membersAlreadyAttending = selectedMembers.filter((member) =>
    partyAttendees.some((attendee) => attendee.user_id === member.user_id)
  );
  const membersToInvite = selectedMembers.filter(
    (member) => !partyAttendees.some((attendee) => attendee.user_id === member.user_id)
  );

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
              Invite Crew
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Party Info */}
        {party && (
          <Card variant="liquid" style={{ marginBottom: Spacing.lg }}>
            <View style={styles.partyInfo}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                <Text variant="body" weight="semibold">
                  {party.name}
                </Text>
                <Text variant="caption" color="secondary">
                  Inviting crew members to this party
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Crew Selection */}
        <View style={styles.section}>
          <Text variant="h4" weight="bold" style={styles.sectionTitle}>
            Select Crew
          </Text>
          {myCrews.length === 0 ? (
            <Card variant="liquid">
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={Colors.text.tertiary} />
                <Text variant="body" color="secondary" center style={{ marginTop: Spacing.md }}>
                  No crews found
                </Text>
                <Text variant="caption" color="tertiary" center style={{ marginTop: Spacing.xs }}>
                  Join or create a crew to invite members
                </Text>
              </View>
            </Card>
          ) : (
            myCrews.map((crew) => (
              <TouchableOpacity
                key={crew.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCrewId(crew.id);
                }}
                style={[
                  styles.crewCard,
                  selectedCrewId === crew.id && styles.crewCardActive,
                ]}
              >
                <Card variant="liquid">
                  <View style={styles.crewContent}>
                    <View style={styles.crewIcon}>
                      <Ionicons
                        name="people"
                        size={24}
                        color={selectedCrewId === crew.id ? Colors.primary : Colors.text.secondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="h4" weight="bold">
                        {crew.name}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {crew.member_count} members
                      </Text>
                    </View>
                    {selectedCrewId === crew.id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Preview */}
        {selectedCrewId && selectedMembers.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" weight="bold" style={styles.sectionTitle}>
              Preview
            </Text>
            <Card variant="liquid">
              <View style={styles.previewStats}>
                <View style={styles.previewStat}>
                  <Text variant="h2" weight="bold" color="primary">
                    {membersToInvite.length}
                  </Text>
                  <Text variant="caption" color="secondary">
                    Will be invited
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewStat}>
                  <Text variant="h2" weight="bold" color="secondary">
                    {membersAlreadyAttending.length}
                  </Text>
                  <Text variant="caption" color="secondary">
                    Already attending
                  </Text>
                </View>
              </View>

              {membersToInvite.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text variant="body" weight="semibold" style={{ marginBottom: Spacing.sm }}>
                    Members to invite:
                  </Text>
                  {membersToInvite.slice(0, 5).map((member, index) => (
                    <View key={member.id} style={styles.memberPreview}>
                      <Ionicons name="person" size={16} color={Colors.text.secondary} />
                      <Text variant="caption" color="secondary" style={{ marginLeft: Spacing.xs }}>
                        {member.user?.full_name || member.user?.username || 'Unknown'}
                      </Text>
                    </View>
                  ))}
                  {membersToInvite.length > 5 && (
                    <Text variant="caption" color="tertiary" style={{ marginTop: Spacing.xs }}>
                      +{membersToInvite.length - 5} more
                    </Text>
                  )}
                </>
              )}
            </Card>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      {selectedCrewId && membersToInvite.length > 0 && (
        <View style={styles.bottomContainer}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['bottom']} style={styles.actionContainer}>
            <Button
              variant="primary"
              gradient
              onPress={handleInviteCrew}
              disabled={inviting}
            >
              {inviting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="people" size={20} color={Colors.white} />
                  <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                    Invite {membersToInvite.length} Member{membersToInvite.length > 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </Button>
          </SafeAreaView>
        </View>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  partyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  crewCard: {
    marginBottom: Spacing.sm,
  },
  crewCardActive: {
    transform: [{ scale: 0.98 }],
  },
  crewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  crewIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
  },
  previewStat: {
    alignItems: 'center',
  },
  previewDivider: {
    width: 1,
    backgroundColor: Colors.border.dark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.dark,
    marginVertical: Spacing.md,
  },
  memberPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
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
});
