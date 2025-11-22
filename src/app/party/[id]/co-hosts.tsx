import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
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
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useCrewStore } from '@/stores/crewStore';
import { useAuthStore } from '@/stores/authStore';
import { PartyCoHost } from '@/types/party';
import { CrewMember } from '@/types/crew';

export default function ManageCoHostsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const partyId = params.id as string;

  const { profile } = useAuthStore();
  const { parties, coHosts, fetchCoHosts, addCoHost, removeCoHost } = usePartyStore();
  const { crewMembers, fetchCrewMembers } = useCrewStore();

  const party = parties.find((p) => p.id === partyId);
  const currentCoHosts = coHosts[partyId] || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    can_edit: true,
    can_invite: true,
    can_manage_attendees: false,
  });

  useEffect(() => {
    if (partyId) {
      fetchCoHosts(partyId);
    }
  }, [partyId]);

  useEffect(() => {
    if (party?.crew_id) {
      fetchCrewMembers(party.crew_id);
    }
  }, [party?.crew_id]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddCoHost = async () => {
    if (!selectedUserId || !partyId) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addCoHost({
        party_id: partyId,
        user_id: selectedUserId,
        role: 'co-host',
        ...permissions,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      setSelectedUserId(null);
      setPermissions({
        can_edit: true,
        can_invite: true,
        can_manage_attendees: false,
      });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to add co-host');
    }
  };

  const handleRemoveCoHost = async (coHost: PartyCoHost) => {
    Alert.alert(
      'Remove Co-Host',
      `Remove ${coHost.user?.display_name || coHost.user?.username || 'this user'} as co-host?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await removeCoHost(partyId, coHost.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.message || 'Failed to remove co-host');
            }
          },
        },
      ]
    );
  };

  // Filter crew members who are not already co-hosts
  const availableMembers = party?.crew_id && crewMembers[party.crew_id]
    ? crewMembers[party.crew_id].filter(
        (member: CrewMember) =>
          member.user_id !== profile?.id &&
          !currentCoHosts.some((coHost) => coHost.user_id === member.user_id)
      )
    : [];

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
              Co-Hosts
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
        {/* Current Co-Hosts */}
        <View style={styles.section}>
          <Text variant="h4" weight="bold" style={styles.sectionTitle}>
            Current Co-Hosts ({currentCoHosts.length})
          </Text>
          {currentCoHosts.length === 0 ? (
            <Card variant="liquid">
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={Colors.text.tertiary} />
                <Text variant="body" color="secondary" center style={{ marginTop: Spacing.md }}>
                  No co-hosts yet
                </Text>
                <Text variant="caption" color="tertiary" center style={{ marginTop: Spacing.xs }}>
                  Add crew members to help manage this party
                </Text>
              </View>
            </Card>
          ) : (
            <Card variant="liquid">
              {currentCoHosts.map((coHost, index) => (
                <View key={coHost.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.coHostItem}>
                    <View style={styles.coHostInfo}>
                      <View style={styles.coHostAvatar}>
                        {coHost.user?.avatar_url ? (
                          <Image
                            source={{ uri: coHost.user.avatar_url }}
                            style={styles.coHostAvatarImage}
                          />
                        ) : (
                          <View style={styles.coHostAvatarPlaceholder}>
                            <Text variant="h4" weight="bold" color="white">
                              {(coHost.user?.display_name || coHost.user?.username)?.charAt(0).toUpperCase() || '?'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="body" weight="semibold">
                          {coHost.user?.display_name || coHost.user?.username || 'Unknown'}
                        </Text>
                        <View style={styles.permissionChips}>
                          {coHost.can_edit && (
                            <View style={styles.permissionChip}>
                              <Ionicons name="create-outline" size={12} color={Colors.accent.blue} />
                              <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                                Edit
                              </Text>
                            </View>
                          )}
                          {coHost.can_invite && (
                            <View style={styles.permissionChip}>
                              <Ionicons name="person-add-outline" size={12} color={Colors.accent.green} />
                              <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                                Invite
                              </Text>
                            </View>
                          )}
                          {coHost.can_manage_attendees && (
                            <View style={styles.permissionChip}>
                              <Ionicons name="people-outline" size={12} color={Colors.accent.purple} />
                              <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                                Manage
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveCoHost(coHost)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>

        {/* Add Co-Host Button */}
        {availableMembers.length > 0 && (
          <Button
            variant="secondary"
            onPress={() => setShowAddModal(true)}
            style={{ marginHorizontal: Spacing.base }}
          >
            <Ionicons name="person-add" size={20} color={Colors.white} />
            <Text variant="button" weight="semibold" color="white" style={{ marginLeft: Spacing.sm }}>
              Add Co-Host
            </Text>
          </Button>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Co-Host Modal */}
      {showAddModal && (
        <View style={styles.modal}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h3" weight="bold">
                Add Co-Host
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setSelectedUserId(null);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Select User */}
              <Text variant="body" weight="semibold" style={{ marginBottom: Spacing.md }}>
                Select Crew Member
              </Text>
              {availableMembers.map((member: CrewMember) => (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedUserId(member.user_id);
                  }}
                  style={[
                    styles.memberOption,
                    selectedUserId === member.user_id && styles.memberOptionActive,
                  ]}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      {member.user?.avatar_url ? (
                        <Image
                          source={{ uri: member.user.avatar_url }}
                          style={styles.memberAvatarImage}
                        />
                      ) : (
                        <View style={styles.memberAvatarPlaceholder}>
                          <Text variant="body" weight="bold" color="white">
                            {(member.user?.full_name || member.user?.username)?.charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View>
                      <Text variant="body" weight="semibold">
                        {member.user?.full_name || member.user?.username || 'Unknown'}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {member.role === 'admin' ? 'Crew Admin' : 'Crew Member'}
                      </Text>
                    </View>
                  </View>
                  {selectedUserId === member.user_id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {selectedUserId && (
                <>
                  {/* Permissions */}
                  <Text variant="body" weight="semibold" style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
                    Permissions
                  </Text>
                  <Card variant="liquid">
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPermissions((prev) => ({ ...prev, can_edit: !prev.can_edit }));
                      }}
                      style={styles.permissionRow}
                    >
                      <View style={styles.permissionLeft}>
                        <Ionicons name="create-outline" size={20} color={Colors.accent.blue} />
                        <View style={{ marginLeft: Spacing.md }}>
                          <Text variant="body" weight="semibold">
                            Can Edit Party
                          </Text>
                          <Text variant="caption" color="secondary">
                            Edit party details and settings
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.toggle, permissions.can_edit && styles.toggleActive]}>
                        <View style={[styles.toggleThumb, permissions.can_edit && styles.toggleThumbActive]} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPermissions((prev) => ({ ...prev, can_invite: !prev.can_invite }));
                      }}
                      style={styles.permissionRow}
                    >
                      <View style={styles.permissionLeft}>
                        <Ionicons name="person-add-outline" size={20} color={Colors.accent.green} />
                        <View style={{ marginLeft: Spacing.md }}>
                          <Text variant="body" weight="semibold">
                            Can Invite
                          </Text>
                          <Text variant="caption" color="secondary">
                            Send party invitations
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.toggle, permissions.can_invite && styles.toggleActive]}>
                        <View style={[styles.toggleThumb, permissions.can_invite && styles.toggleThumbActive]} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPermissions((prev) => ({ ...prev, can_manage_attendees: !prev.can_manage_attendees }));
                      }}
                      style={styles.permissionRow}
                    >
                      <View style={styles.permissionLeft}>
                        <Ionicons name="people-outline" size={20} color={Colors.accent.purple} />
                        <View style={{ marginLeft: Spacing.md }}>
                          <Text variant="body" weight="semibold">
                            Can Manage Attendees
                          </Text>
                          <Text variant="caption" color="secondary">
                            Remove attendees and manage list
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.toggle, permissions.can_manage_attendees && styles.toggleActive]}>
                        <View style={[styles.toggleThumb, permissions.can_manage_attendees && styles.toggleThumbActive]} />
                      </View>
                    </TouchableOpacity>
                  </Card>

                  {/* Add Button */}
                  <Button
                    variant="primary"
                    gradient
                    onPress={handleAddCoHost}
                    style={{ marginTop: Spacing.xl }}
                  >
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                    <Text variant="button" weight="bold" color="white" style={{ marginLeft: Spacing.sm }}>
                      Add Co-Host
                    </Text>
                  </Button>
                </>
              )}
            </ScrollView>
          </View>
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
  coHostItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  coHostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  coHostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  coHostAvatarImage: {
    width: '100%',
    height: '100%',
  },
  coHostAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  permissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.sm,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.dark,
    marginVertical: Spacing.xs,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 500,
  },
  memberOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberOptionActive: {
    backgroundColor: 'rgba(255, 94, 120, 0.1)',
    borderColor: Colors.primary,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
  },
  memberAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
