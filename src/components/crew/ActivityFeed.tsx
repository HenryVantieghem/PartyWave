import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface Activity {
  id: string;
  crew_id: string;
  user_id: string;
  activity_type: 'member_joined' | 'member_left' | 'party_created' | 'party_attended' | 'role_changed' | 'vouch_given';
  metadata: any;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface ActivityFeedProps {
  crewId: string;
  limit?: number;
}

export function ActivityFeed({ crewId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`crew_activity:${crewId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crew_activity',
          filter: `crew_id=eq.${crewId}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as Activity, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [crewId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('crew_activity')
        .select(`
          *,
          user:profiles(id, username, display_name, avatar_url)
        `)
        .eq('crew_id', crewId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const getActivityIcon = (type: Activity['activity_type']) => {
    switch (type) {
      case 'member_joined':
        return { name: 'person-add' as const, color: Colors.accent.green };
      case 'member_left':
        return { name: 'person-remove' as const, color: Colors.accent.orange };
      case 'party_created':
        return { name: 'calendar' as const, color: Colors.primary };
      case 'party_attended':
        return { name: 'checkmark-circle' as const, color: Colors.success };
      case 'role_changed':
        return { name: 'star' as const, color: Colors.accent.gold };
      case 'vouch_given':
        return { name: 'heart' as const, color: Colors.accent.purple };
      default:
        return { name: 'flash' as const, color: Colors.text.secondary };
    }
  };

  const getActivityText = (activity: Activity) => {
    const userName = activity.user?.display_name || activity.user?.username || 'Someone';

    switch (activity.activity_type) {
      case 'member_joined':
        return `${userName} joined the crew`;
      case 'member_left':
        return `${userName} left the crew`;
      case 'party_created':
        return `${userName} created a party${activity.metadata?.partyName ? ': ' + activity.metadata.partyName : ''}`;
      case 'party_attended':
        return `${userName} attended a party${activity.metadata?.partyName ? ': ' + activity.metadata.partyName : ''}`;
      case 'role_changed':
        return `${userName} became ${activity.metadata?.newRole || 'an admin'}`;
      case 'vouch_given':
        return `${userName} vouched for ${activity.metadata?.targetUserName || 'someone'}`;
      default:
        return `${userName} did something`;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.emptyState}>
        <Text variant="caption" color="secondary">
          Loading activity...
        </Text>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="flash-outline" size={48} color={Colors.text.tertiary} />
        <Text variant="body" color="secondary" center style={{ marginTop: Spacing.md }}>
          No activity yet
        </Text>
        <Text variant="caption" color="tertiary" center>
          Crew activity will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Card variant="liquid">
        {activities.map((activity, index) => {
          const icon = getActivityIcon(activity.activity_type);

          return (
            <View key={activity.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.activityItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityHeader}>
                    {activity.user && (
                      <Avatar
                        source={{ uri: activity.user.avatar_url }}
                        size="sm"
                        fallbackText={activity.user.display_name}
                      />
                    )}
                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                      <Text variant="body" weight="medium">
                        {getActivityText(activity)}
                      </Text>
                      <Text variant="caption" color="tertiary">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.dark,
    marginVertical: Spacing.xs,
  },
});
