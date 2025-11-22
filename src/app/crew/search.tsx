import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useCrewStore } from '@/stores/crewStore';
import { supabase } from '@/lib/supabase';
import type { Crew, CrewType, CrewPrivacy } from '@/types/crew';

const DEBOUNCE_DELAY = 300;

export default function CrewSearchScreen() {
  const router = useRouter();
  const { myCrews } = useCrewStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<CrewType | 'all'>('all');
  const [selectedPrivacy, setSelectedPrivacy] = useState<CrewPrivacy | 'all'>('all');
  const [minMembers, setMinMembers] = useState<number>(0);
  const [maxMembers, setMaxMembers] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<'relevance' | 'members' | 'reputation'>('relevance');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedType, selectedPrivacy, minMembers, maxMembers, sortBy]);

  const performSearch = async () => {
    try {
      setLoading(true);

      const myCrewIds = myCrews.map((c) => c.id);

      // Build query
      let query = supabase
        .from('party_crews')
        .select('*')
        .eq('active_status', true)
        .not('id', 'in', `(${myCrewIds.length > 0 ? myCrewIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply type filter
      if (selectedType !== 'all') {
        query = query.eq('crew_type', selectedType);
      }

      // Apply privacy filter
      if (selectedPrivacy !== 'all') {
        query = query.eq('privacy_setting', selectedPrivacy);
      }

      // Apply member count filter
      query = query.gte('member_count', minMembers).lte('member_count', maxMembers);

      // Apply sorting
      if (sortBy === 'members') {
        query = query.order('member_count', { ascending: false });
      } else if (sortBy === 'reputation') {
        query = query.order('reputation_score', { ascending: false });
      } else {
        // Relevance sort (by reputation)
        query = query.order('reputation_score', { ascending: false });
      }

      query = query.limit(50);

      const { data, error } = await query;

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching crews:', error);
      Alert.alert('Error', 'Failed to search crews');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType('all');
    setSelectedPrivacy('all');
    setMinMembers(0);
    setMaxMembers(1000);
    setSortBy('relevance');
  };

  const getCrewTypeIcon = (crewType: string) => {
    switch (crewType) {
      case 'inner':
        return 'lock-closed';
      case 'extended':
        return 'people';
      case 'open':
        return 'earth';
      default:
        return 'people';
    }
  };

  const getCrewTypeColor = (crewType: string) => {
    switch (crewType) {
      case 'inner':
        return Colors.accent.purple;
      case 'extended':
        return Colors.accent.blue;
      case 'open':
        return Colors.accent.green;
      default:
        return Colors.text.secondary;
    }
  };

  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedPrivacy !== 'all' ||
    minMembers > 0 ||
    maxMembers < 1000 ||
    sortBy !== 'relevance';

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
              Search Crews
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                <Text variant="caption" weight="semibold" color="primary">
                  Clear
                </Text>
              </TouchableOpacity>
            )}
            {!hasActiveFilters && <View style={{ width: 40 }} />}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search crews by name..."
                placeholderTextColor={Colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filters Section */}
        <View style={styles.filtersSection}>
          {/* Crew Type Filter */}
          <View style={styles.filterGroup}>
            <Text variant="body" weight="semibold" style={styles.filterLabel}>
              Crew Type
            </Text>
            <View style={styles.filterChips}>
              {(['all', 'open', 'extended', 'inner'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type);
                  }}
                  style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    color={selectedType === type ? 'white' : 'secondary'}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy Filter */}
          <View style={styles.filterGroup}>
            <Text variant="body" weight="semibold" style={styles.filterLabel}>
              Privacy
            </Text>
            <View style={styles.filterChips}>
              {(['all', 'public', 'closed', 'private'] as const).map((privacy) => (
                <TouchableOpacity
                  key={privacy}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPrivacy(privacy);
                  }}
                  style={[styles.filterChip, selectedPrivacy === privacy && styles.filterChipActive]}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    color={selectedPrivacy === privacy ? 'white' : 'secondary'}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {privacy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By Filter */}
          <View style={styles.filterGroup}>
            <Text variant="body" weight="semibold" style={styles.filterLabel}>
              Sort By
            </Text>
            <View style={styles.filterChips}>
              {(['relevance', 'members', 'reputation'] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(sort);
                  }}
                  style={[styles.filterChip, sortBy === sort && styles.filterChipActive]}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    color={sortBy === sort ? 'white' : 'secondary'}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {sort}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text variant="body" color="secondary" style={{ marginTop: Spacing.md }}>
                Searching...
              </Text>
            </View>
          ) : searchQuery.trim().length === 0 ? (
            <Card variant="liquid">
              <View style={styles.emptyState}>
                <Ionicons name="search" size={64} color={Colors.text.tertiary} />
                <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
                  Search for Crews
                </Text>
                <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                  Enter a crew name to start searching
                </Text>
              </View>
            </Card>
          ) : searchResults.length === 0 ? (
            <Card variant="liquid">
              <View style={styles.emptyState}>
                <Ionicons name="sad-outline" size={64} color={Colors.text.tertiary} />
                <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
                  No Results
                </Text>
                <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                  Try adjusting your search or filters
                </Text>
              </View>
            </Card>
          ) : (
            <>
              <Text variant="body" color="secondary" style={{ marginBottom: Spacing.md }}>
                Found {searchResults.length} crew{searchResults.length !== 1 ? 's' : ''}
              </Text>
              {searchResults.map((crew) => (
                <Card key={crew.id} variant="liquid" style={styles.crewCard}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/crew/${crew.id}` as any);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.crewHeader}>
                      <Avatar
                        source={{ uri: crew.avatar_url }}
                        size="md"
                        fallbackText={crew.name}
                        style={{ backgroundColor: crew.theme_color || Colors.primary }}
                      />
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <View style={styles.crewNameRow}>
                          <Text variant="h4" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                            {crew.name}
                          </Text>
                          <View style={[styles.typeBadge, { backgroundColor: getCrewTypeColor(crew.crew_type) }]}>
                            <Ionicons name={getCrewTypeIcon(crew.crew_type) as any} size={12} color={Colors.white} />
                            <Text variant="caption" weight="semibold" color="white" style={{ marginLeft: 4 }}>
                              {crew.crew_type}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.crewStats}>
                          <View style={styles.statItem}>
                            <Ionicons name="people" size={14} color={Colors.text.secondary} />
                            <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                              {crew.member_count} members
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <Ionicons name="star" size={14} color={Colors.accent.gold} />
                            <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                              {Math.round(crew.reputation_score)}
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <Ionicons
                              name={crew.privacy_setting === 'public' ? 'globe' : 'lock-closed'}
                              size={14}
                              color={Colors.text.secondary}
                            />
                            <Text variant="caption" color="secondary" style={{ marginLeft: 4, textTransform: 'capitalize' }}>
                              {crew.privacy_setting}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {crew.description && (
                      <Text variant="body" color="secondary" numberOfLines={2} style={{ marginTop: Spacing.sm }}>
                        {crew.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}
        </View>

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
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  filtersSection: {
    marginBottom: Spacing.lg,
  },
  filterGroup: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    marginBottom: Spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  resultsSection: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  crewCard: {
    marginBottom: Spacing.base,
  },
  crewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  crewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  crewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
