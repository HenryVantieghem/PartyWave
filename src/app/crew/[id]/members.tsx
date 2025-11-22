import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useCrewStore } from '@/stores/crewStore';
import { useAuthStore } from '@/stores/authStore';
import type { CrewMember, CrewRole } from '@/types/crew';
import { formatDistanceToNow } from 'date-fns';

export default function MemberManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const crewId = params.id as string;

  const { profile } = useAuthStore();
  const { currentCrew, crewMembers, fetchCrew, fetchCrewMembers, updateMemberRole, removeCrewMember } = useCrewStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<CrewRole | 'all'>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const members = crewMembers[crewId] || [];
  const myMembership = members.find((m) => m.user_id === profile?.id);
  const canManage = myMembership?.role === 'owner' || myMembership?.role === 'admin';

  useEffect(() => {
    if (crewId) {
      fetchCrew(crewId);
      fetchCrewMembers(crewId);
    }
  }, [crewId]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleToggleBulkMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBulkMode(!bulkMode);
    setSelectedMembers(new Set());
  };

  const handleToggleSelection = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedMembers(newSelection);
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map((m) => m.user_id)));
    }
  };

  const handleChangeRole = async (userId: string, currentRole: CrewRole, userName: string) => {
    const roleOptions =
      myMembership?.role === 'owner'
        ? [
            { text: 'Member', role: 'member' as const },
            { text: 'Admin', role: 'admin' as const },
          ]
        : [{ text: 'Member', role: 'member' as const }];

    const buttons = roleOptions
      .filter((opt) => opt.role !== currentRole)
      .map((opt) => ({
        text: opt.text,
        onPress: async () => {
          try {
            setLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const success = await updateMemberRole(crewId, userId, opt.role);

            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `${userName} is now ${opt.text === 'Member' ? 'a member' : 'an admin'}`);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to update role');
            }
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update role');
          } finally {
            setLoading(false);
          }
        },
      }));

    Alert.alert('Change Role', `Update role for ${userName}?`, [...buttons, { text: 'Cancel', style: 'cancel' }]);
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    Alert.alert('Remove Member', `Remove ${userName} from this crew?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const success = await removeCrewMember(crewId, userId);

            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to remove member');
            }
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to remove member');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleBulkRemove = () => {
    if (selectedMembers.size === 0) return;

    Alert.alert(
      'Remove Members',
      `Remove ${selectedMembers.size} member${selectedMembers.size > 1 ? 's' : ''} from this crew?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

              const promises = Array.from(selectedMembers).map((userId) => removeCrewMember(crewId, userId));

              await Promise.all(promises);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelectedMembers(new Set());
              setBulkMode(false);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove members');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      member.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || member.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: CrewRole) => {
    switch (role) {
      case 'owner':
        return Colors.accent.gold;
      case 'admin':
        return Colors.accent.purple;
      case 'member':
        return Colors.accent.blue;
      default:
        return Colors.text.secondary;
    }
  };

  const getRoleIcon = (role: CrewRole) => {
    switch (role) {
      case 'owner':
        return 'crown';
      case 'admin':
        return 'shield';
      case 'member':
        return 'person';
      default:
        return 'person';
    }
  };

  if (!canManage) {
    return (
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text variant="h3" weight="bold">
                Members
              </Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </BlurView>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={64} color={Colors.text.tertiary} />
          <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
            Admin Access Required
          </Text>
          <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
            Only admins can manage members
          </Text>
        </View>
      </View>
    );
  }

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
              Manage Members
            </Text>
            <TouchableOpacity onPress={handleToggleBulkMode} style={styles.bulkButton}>
              <Ionicons name={bulkMode ? 'close' : 'checkmark-done'} size={24} color={bulkMode ? Colors.error : Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members..."
                placeholderTextColor={Colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            {(['all', 'owner', 'admin', 'member'] as const).map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilterRole(role);
                }}
                style={[styles.filterTab, filterRole === role && styles.filterTabActive]}
              >
                <Text
                  variant="caption"
                  weight={filterRole === role ? 'bold' : 'medium'}
                  color={filterRole === role ? 'white' : 'secondary'}
                  style={{ textTransform: 'capitalize' }}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bulk Actions Bar */}
          {bulkMode && (
            <View style={styles.bulkActionsBar}>
              <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
                <Ionicons
                  name={selectedMembers.size === filteredMembers.length ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={Colors.primary}
                />
                <Text variant="body" weight="semibold" style={{ marginLeft: Spacing.sm }}>
                  {selectedMembers.size === filteredMembers.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              {selectedMembers.size > 0 && (
                <TouchableOpacity onPress={handleBulkRemove} style={styles.bulkRemoveButton}>
                  <Ionicons name="trash" size={18} color={Colors.error} />
                  <Text variant="caption" weight="semibold" color="error" style={{ marginLeft: 4 }}>
                    Remove ({selectedMembers.size})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </SafeAreaView>
      </BlurView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="caption" color="secondary" style={{ marginBottom: Spacing.md }}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </Text>

        {filteredMembers.map((member) => {
          const isSelected = selectedMembers.has(member.user_id);
          const isOwner = member.role === 'owner';
          const isMe = member.user_id === profile?.id;

          return (
            <Card key={member.id} variant="liquid" style={styles.memberCard}>
              <TouchableOpacity
                onPress={() => {
                  if (bulkMode) {
                    handleToggleSelection(member.user_id);
                  } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/profile/${member.user_id}` as any);
                  }
                }}
                activeOpacity={0.7}
                style={[styles.memberContent, isSelected && styles.memberSelected]}
              >
                {bulkMode && (
                  <View style={styles.checkbox}>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isSelected ? Colors.primary : Colors.text.tertiary}
                    />
                  </View>
                )}

                <Avatar
                  source={{ uri: member.user?.avatar_url }}
                  size="md"
                  fallbackText={member.user?.full_name || member.user?.username}
                />

                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <View style={styles.memberHeader}>
                    <Text variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
                      {member.user?.full_name || member.user?.username}
                      {isMe && (
                        <Text variant="caption" color="secondary">
                          {' '}
                          (You)
                        </Text>
                      )}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                      <Ionicons name={getRoleIcon(member.role) as any} size={12} color={Colors.white} />
                      <Text variant="caption" weight="semibold" color="white" style={{ marginLeft: 4, textTransform: 'capitalize' }}>
                        {member.role}
                      </Text>
                    </View>
                  </View>

                  <Text variant="caption" color="tertiary">
                    Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                  </Text>

                  {!bulkMode && !isMe && (
                    <View style={styles.memberActions}>
                      {!isOwner && (
                        <TouchableOpacity
                          onPress={() =>
                            handleChangeRole(member.user_id, member.role, member.user?.full_name || member.user?.username || 'User')
                          }
                          style={styles.actionButton}
                        >
                          <Ionicons name="swap-horizontal" size={16} color={Colors.accent.blue} />
                          <Text variant="caption" weight="semibold" color="secondary" style={{ marginLeft: 4 }}>
                            Change Role
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!isOwner && (
                        <TouchableOpacity
                          onPress={() =>
                            handleRemoveMember(member.user_id, member.user?.full_name || member.user?.username || 'User')
                          }
                          style={styles.actionButton}
                        >
                          <Ionicons name="close-circle" size={16} color={Colors.error} />
                          <Text variant="caption" weight="semibold" color="error" style={{ marginLeft: 4 }}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Card>
          );
        })}

        {filteredMembers.length === 0 && (
          <Card variant="liquid">
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={Colors.text.tertiary} />
              <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
                No Members Found
              </Text>
              <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                Try adjusting your search or filters
              </Text>
            </View>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <ActivityIndicator size="large" color={Colors.primary} />
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
  bulkButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.dark,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: 'SF-Pro-Text-Medium',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: BorderRadius.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  memberCard: {
    marginBottom: Spacing.base,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memberSelected: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  memberActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
