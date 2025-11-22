import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
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
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  type: 'party_invite' | 'crew_invite' | 'party_reminder' | 'crew_activity' | 'vouch_received' | 'party_update' | 'message';
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.action_url) {
      router.push(notification.action_url as any);
    } else if (notification.data.party_id) {
      router.push(`/party/${notification.data.party_id}` as any);
    } else if (notification.data.crew_id) {
      router.push(`/crew/${notification.data.crew_id}` as any);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'party_invite':
        return { name: 'calendar' as const, color: Colors.primary };
      case 'crew_invite':
        return { name: 'people' as const, color: Colors.accent.blue };
      case 'party_reminder':
        return { name: 'time' as const, color: Colors.accent.orange };
      case 'crew_activity':
        return { name: 'flash' as const, color: Colors.accent.purple };
      case 'vouch_received':
        return { name: 'heart' as const, color: Colors.accent.pink };
      case 'party_update':
        return { name: 'alert-circle' as const, color: Colors.accent.gold };
      case 'message':
        return { name: 'chatbubble' as const, color: Colors.accent.green };
      default:
        return { name: 'notifications' as const, color: Colors.text.secondary };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text variant="h3" weight="bold">
              Notifications
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/notifications' as any);
              }}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter('all');
              }}
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            >
              <Text
                variant="body"
                weight={filter === 'all' ? 'bold' : 'medium'}
                color={filter === 'all' ? 'white' : 'secondary'}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter('unread');
              }}
              style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            >
              <Text
                variant="body"
                weight={filter === 'unread' ? 'bold' : 'medium'}
                color={filter === 'unread' ? 'white' : 'secondary'}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <View style={styles.actionBar}>
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
                <Text variant="caption" weight="semibold" color="primary" style={{ marginLeft: 4 }}>
                  Mark All Read
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <Card variant="liquid" style={{ marginTop: Spacing.xl }}>
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color={Colors.text.tertiary} />
              <Text variant="h4" weight="bold" center style={{ marginTop: Spacing.md }}>
                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              </Text>
              <Text variant="body" color="secondary" center style={{ marginTop: Spacing.xs }}>
                {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
              </Text>
            </View>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);

            return (
              <Card key={notification.id} variant="liquid" style={styles.notificationCard}>
                <TouchableOpacity
                  onPress={() => handleNotificationPress(notification)}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert('Delete Notification', 'Remove this notification?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteNotification(notification.id) },
                    ]);
                  }}
                  activeOpacity={0.7}
                  style={[styles.notificationContent, !notification.read && styles.notificationUnread]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                  </View>

                  <View style={styles.notificationBody}>
                    <Text variant="body" weight="semibold" numberOfLines={2}>
                      {notification.title}
                    </Text>
                    <Text variant="caption" color="secondary" numberOfLines={2} style={{ marginTop: 2 }}>
                      {notification.body}
                    </Text>
                    <Text variant="caption" color="tertiary" style={{ marginTop: Spacing.xs }}>
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </Text>
                  </View>

                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
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
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
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
  notificationCard: {
    marginBottom: Spacing.base,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationUnread: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notificationBody: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
});
