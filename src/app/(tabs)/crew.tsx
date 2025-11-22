// ============================================
// CREW TAB - PARTY CREWS SYSTEM
// ============================================
// Main crew management screen
// ============================================

import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCrewStore } from '@/stores/crewStore';
import { CrewCard } from '@/components/crew/CrewCard';
import { CrewInviteCard } from '@/components/crew/CrewInviteCard';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function CrewScreen() {
  const {
    myCrews,
    pendingInvites,
    loading,
    fetchMyCrews,
    fetchPendingInvites,
    respondToInvite,
  } = useCrewStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchMyCrews(),
      fetchPendingInvites(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptInvite = async (inviteId: string) => {
    await respondToInvite(inviteId, true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeclineInvite = async (inviteId: string) => {
    await respondToInvite(inviteId, false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateCrew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/crew/create');
  };

  const handleCrewPress = (crewId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/crew/${crewId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Crews</Text>
          <Text style={styles.subtitle}>
            Your party squads
          </Text>
        </View>
        <Pressable
          onPress={handleCreateCrew}
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </Pressable>
      </View>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <View style={styles.invitesSection}>
          <Text style={styles.sectionTitle}>
            Pending Invites ({pendingInvites.length})
          </Text>
          <FlatList
            data={pendingInvites}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.inviteCardContainer}>
                <CrewInviteCard
                  invite={item}
                  onAccept={handleAcceptInvite}
                  onDecline={handleDeclineInvite}
                />
              </View>
            )}
            contentContainerStyle={styles.invitesList}
          />
        </View>
      )}

      {/* My Crews List */}
      <View style={styles.content}>
        {loading && myCrews.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading crews...</Text>
          </View>
        ) : myCrews.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={64} color={Colors.text.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No Crews Yet</Text>
            <Text style={styles.emptyDescription}>
              Create or join a crew to start partying together
            </Text>
            <Pressable
              onPress={handleCreateCrew}
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.emptyButtonPressed,
              ]}
            >
              <Ionicons name="add-circle" size={20} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Create Your First Crew</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={myCrews}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CrewCard
                crew={item}
                onPress={() => handleCrewPress(item.id)}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            ListHeaderComponent={
              <Text style={styles.listHeader}>
                My Crews ({myCrews.length})
              </Text>
            }
          />
        )}
      </View>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  invitesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  invitesList: {
    paddingHorizontal: Spacing.lg,
  },
  inviteCardContainer: {
    width: 300,
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonPressed: {
    opacity: 0.8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
