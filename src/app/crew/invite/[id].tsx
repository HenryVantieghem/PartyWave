// ============================================
// CREW INVITE SCREEN
// ============================================
// Search and invite users to crew
// ============================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCrewStore } from '@/stores/crewStore';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

interface UserSearchResult {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function CrewInviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentCrew, crewMembers, fetchCrew, fetchCrewMembers, inviteToCrew } = useCrewStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchCrew(id);
      fetchCrewMembers(id);
    }
  }, [id]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${searchQuery.trim()}%`)
        .limit(20);

      if (error) throw error;

      // Filter out users already in crew
      const memberIds = crewMembers[id || '']?.map(m => m.user_id) || [];
      const filtered = (data || []).filter(user => !memberIds.includes(user.id));

      setSearchResults(filtered);
    } catch (error: any) {
      console.error('Error searching users:', error);
      Alert.alert('Search Error', 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (userId: string) => {
    if (!id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInviting(prev => ({ ...prev, [userId]: true }));

    try {
      await inviteToCrew(id, userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));

      Alert.alert('Invite Sent', 'Crew invite has been sent successfully');
    } catch (error: any) {
      console.error('Error inviting user:', error);
      Alert.alert('Invite Failed', 'Failed to send crew invite');
    } finally {
      setInviting(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Invite to {currentCrew?.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by username..."
          placeholderTextColor={Colors.text.tertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {searching && (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.searchLoader} />
        )}
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleInvite(item.id)}
            disabled={inviting[item.id]}
            style={({ pressed }) => [
              styles.userItem,
              pressed && styles.userItemPressed,
            ]}
          >
            <Avatar
              source={item.avatar_url ? { uri: item.avatar_url } : undefined}
              name={item.username}
              size="md"
            />
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username}</Text>
              {item.full_name && (
                <Text style={styles.fullName}>{item.full_name}</Text>
              )}
            </View>
            {inviting[item.id] ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="person-add" size={24} color={Colors.primary} />
            )}
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {searchQuery.trim().length === 0 ? (
              <>
                <Ionicons name="search-outline" size={64} color={Colors.text.secondary} />
                <Text style={styles.emptyTitle}>Search for Users</Text>
                <Text style={styles.emptyDescription}>
                  Enter a username to find people to invite
                </Text>
              </>
            ) : searching ? null : (
              <>
                <Ionicons name="sad-outline" size={64} color={Colors.text.secondary} />
                <Text style={styles.emptyTitle}>No Users Found</Text>
                <Text style={styles.emptyDescription}>
                  Try a different search term
                </Text>
              </>
            )}
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          searchResults.length === 0 && styles.listContentEmpty,
        ]}
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
    paddingVertical: Spacing.md,
  },
  searchLoader: {
    marginLeft: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  listContentEmpty: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  userItemPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  fullName: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
