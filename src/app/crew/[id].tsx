// ============================================
// CREW DETAIL SCREEN
// ============================================
// View and manage individual crew
// ============================================

import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCrewStore } from '@/stores/crewStore';
import { useAuthStore } from '@/stores/authStore';
import { CrewAvatar } from '@/components/crew/CrewAvatar';
import { CrewMemberItem } from '@/components/crew/CrewMemberItem';
import { MemberActionSheet } from '@/components/crew/MemberActionSheet';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import type { CrewMember } from '@/types/crew';
import * as Haptics from 'expo-haptics';

export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    currentCrew,
    crewMembers,
    loading,
    fetchCrew,
    fetchCrewMembers,
    fetchCrewActivity,
    updateMemberRole,
    removeCrewMember,
  } = useCrewStore();

  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  useEffect(() => {
    if (id) {
      loadCrewData();
    }
  }, [id]);

  const loadCrewData = async () => {
    if (!id) return;
    await Promise.all([
      fetchCrew(id),
      fetchCrewMembers(id),
      fetchCrewActivity(id),
    ]);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleMemberPress = (member: CrewMember) => {
    if (!id || member.user_id === user?.id) return; // Can't manage yourself
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMember(member);
    setActionSheetVisible(true);
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    if (!id) return;
    const success = await updateMemberRole(id, memberId, 'admin');
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchCrewMembers(id);
    }
  };

  const handleDemoteToMember = async (memberId: string) => {
    if (!id) return;
    const success = await updateMemberRole(id, memberId, 'member');
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchCrewMembers(id);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the crew?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeCrewMember(id, memberId);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await fetchCrewMembers(id);
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (userId: string) => {
    // TODO: Navigate to user profile when implemented
    Alert.alert('View Profile', 'Profile view coming soon!');
  };

  const handleSettings = () => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/crew/settings/${id}`);
  };

  const userRole = crewMembers[id || '']?.find(m => m.user_id === user?.id)?.role;
  const canManageCrew = userRole === 'owner' || userRole === 'admin';

  if (loading && !currentCrew) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading crew...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentCrew) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.text.secondary} />
          <Text style={styles.errorText}>Crew not found</Text>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.white} />
        </Pressable>
        {canManageCrew && (
          <Pressable onPress={handleSettings} style={styles.menuButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Crew Info */}
        <View style={styles.infoSection}>
          <View style={styles.avatarContainer}>
            <CrewAvatar
              avatarUrl={currentCrew.avatar_url}
              name={currentCrew.name}
              size={100}
              themeColor={currentCrew.theme_color}
            />
          </View>
          <Text style={styles.crewName}>{currentCrew.name}</Text>
          {currentCrew.description && (
            <Text style={styles.crewDescription}>{currentCrew.description}</Text>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentCrew.member_count}</Text>
              <Text style={styles.statLabel}>
                {currentCrew.member_count === 1 ? 'Member' : 'Members'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentCrew.reputation_score}</Text>
              <Text style={styles.statLabel}>Reputation</Text>
            </View>
          </View>
        </View>

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Members ({currentCrew.members?.length || 0})
          </Text>
          {currentCrew.members?.map((member) => (
            <CrewMemberItem
              key={member.id}
              member={member}
              showRole
              onPress={canManageCrew ? () => handleMemberPress(member) : undefined}
            />
          ))}
        </View>
      </ScrollView>

      {/* Member Action Sheet */}
      <MemberActionSheet
        visible={actionSheetVisible}
        member={selectedMember}
        currentUserRole={userRole || 'member'}
        onClose={() => setActionSheetVisible(false)}
        onPromoteToAdmin={handlePromoteToAdmin}
        onDemoteToMember={handleDemoteToMember}
        onRemoveMember={handleRemoveMember}
        onViewProfile={handleViewProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  crewName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  crewDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  membersSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
