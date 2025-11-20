import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Mock crew data
const mockCrew = [
  {
    id: '1',
    name: 'Sarah Chen',
    username: '@sarahchen',
    avatar: undefined,
    title: 'Party Legend',
    titleIcon: 'trophy',
    titleColor: Colors.accent.gold,
    parties: 15,
    energy: 95,
    lastPartied: '2 days ago',
    isBFF: true,
  },
  {
    id: '2',
    name: 'Mike Johnson',
    username: '@mikej',
    avatar: undefined,
    title: 'Host Master',
    titleIcon: 'home',
    titleColor: Colors.text.secondary,
    parties: 8,
    energy: 78,
    lastPartied: '1 week ago',
    isBFF: false,
  },
  {
    id: '3',
    name: 'Emma Davis',
    username: '@emmad',
    avatar: undefined,
    title: 'Memory Maker',
    titleIcon: 'camera',
    titleColor: Colors.accent.blue,
    parties: 12,
    energy: 89,
    lastPartied: '3 days ago',
    isBFF: true,
  },
];

const mockSuggestions = [
  {
    id: '4',
    name: 'Alex Rivera',
    username: '@alexr',
    avatar: undefined,
    mutualFriends: 5,
  },
  {
    id: '5',
    name: 'Jordan Kim',
    username: '@jordank',
    avatar: undefined,
    mutualFriends: 3,
  },
];

export default function CrewScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'crew' | 'suggestions'>('crew');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab: 'crew' | 'suggestions') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const stats = [
    { icon: 'people', value: 156, label: 'Friends' },
    { icon: 'star', value: 23, label: 'Party BFFs' },
    { icon: 'heart', value: 8, label: 'New This Month' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="black" style={styles.headerTitle}>
            Party Crew
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Avatar source={profile?.avatar_url} name={profile?.display_name} size="sm" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your party crew..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Ionicons name={stat.icon as any} size={24} color={Colors.primary} />
                <Text variant="h3" weight="bold" center style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text variant="caption" center color="secondary" style={styles.statLabel}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, activeTab === 'crew' && styles.segmentActive]}
              onPress={() => handleTabChange('crew')}
            >
              <Text
                variant="body"
                weight="semibold"
                color={activeTab === 'crew' ? 'white' : 'secondary'}
              >
                My Crew
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, activeTab === 'suggestions' && styles.segmentActive]}
              onPress={() => handleTabChange('suggestions')}
            >
              <Text
                variant="body"
                weight="semibold"
                color={activeTab === 'suggestions' ? 'white' : 'secondary'}
              >
                Suggestions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'crew' ? (
            <View style={styles.content}>
              <View style={styles.sectionHeader}>
                <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                  Your Party Crew
                </Text>
                <Text variant="caption" color="tertiary" style={styles.sectionSubtitle}>
                  Friends you party with most
                </Text>
              </View>

              {mockCrew.map((member) => (
                <Card key={member.id} variant="glass" style={styles.memberCard}>
                  <View style={styles.memberContent}>
                    <Avatar
                      source={member.avatar}
                      name={member.name}
                      size="lg"
                      gradient
                    />
                    <View style={styles.memberInfo}>
                      <View style={styles.memberHeader}>
                        <Text variant="body" weight="bold" style={styles.memberName}>
                          {member.name}
                        </Text>
                        {member.isBFF && (
                          <Ionicons name="star" size={16} color={Colors.accent.gold} />
                        )}
                      </View>
                      <View style={styles.memberTitleRow}>
                        <Ionicons name={member.titleIcon as any} size={14} color={member.titleColor} />
                        <Text variant="caption" color="secondary" style={styles.memberTitle}>
                          {member.title}
                        </Text>
                      </View>
                      <View style={styles.memberStats}>
                        <View style={styles.memberStatItem}>
                          <Ionicons name="calendar" size={14} color={Colors.text.tertiary} />
                          <Text variant="caption" color="tertiary" style={styles.memberStatText}>
                            {member.parties} parties
                          </Text>
                        </View>
                        <View style={styles.memberStatItem}>
                          <Ionicons name="flash" size={14} color={Colors.accent.orange} />
                          <Text variant="caption" color="tertiary" style={styles.memberStatText}>
                            {member.energy}% energy
                          </Text>
                        </View>
                      </View>
                      <Text variant="caption" color="tertiary" style={styles.lastPartied}>
                        Last partied: {member.lastPartied}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.inviteButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // TODO: Invite to party
                      }}
                    >
                      <Ionicons name="add" size={20} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.sectionHeader}>
                <Text variant="h4" weight="bold" style={styles.sectionTitle}>
                  Suggested Friends
                </Text>
                <Text variant="caption" color="tertiary" style={styles.sectionSubtitle}>
                  People you might know
                </Text>
              </View>

              {mockSuggestions.map((suggestion) => (
                <Card key={suggestion.id} variant="glass" style={styles.memberCard}>
                  <View style={styles.memberContent}>
                    <Avatar
                      source={suggestion.avatar}
                      name={suggestion.name}
                      size="lg"
                      gradient
                    />
                    <View style={styles.memberInfo}>
                      <Text variant="body" weight="bold" style={styles.memberName}>
                        {suggestion.name}
                      </Text>
                      <Text variant="caption" color="secondary" style={styles.memberUsername}>
                        {suggestion.username}
                      </Text>
                      <Text variant="caption" color="tertiary" style={styles.mutualFriends}>
                        {suggestion.mutualFriends} mutual friends
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // TODO: Add friend
                      }}
                    >
                      <Text variant="label" color="white" weight="semibold">
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
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
  },
  headerTitle: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  statLabel: {
    fontSize: 11,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    marginTop: Spacing.base,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xxs,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  memberCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  memberName: {
    fontSize: 16,
  },
  memberTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  memberTitle: {
    fontSize: 12,
  },
  memberStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  memberStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberStatText: {
    fontSize: 11,
  },
  lastPartied: {
    fontSize: 11,
    marginTop: Spacing.xxs,
  },
  memberUsername: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  mutualFriends: {
    fontSize: 11,
  },
  inviteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
});

