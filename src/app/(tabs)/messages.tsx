import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { formatRelativeTime } from '@/lib/utils';

// Type definitions for conversations
interface Conversation {
  id: string;
  user_id: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  last_message: {
    content: string;
    sent_at: string;
    is_read: boolean;
    sender_id: string;
  } | null;
  unread_count: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [profile?.id]);

  const loadConversations = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);

      // TODO: Fetch real conversations from Supabase
      // For now, showing empty state
      const { supabase } = await import('@/lib/supabase');

      // Query for conversations (DMs) - only get DMs (where party_id is null)
      const { data, error } = await supabase
        .from('party_messages')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .is('party_id', null)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group messages by conversation
      const conversationsMap = new Map<string, Conversation>();

      data?.forEach((message: any) => {
        const otherUserId = message.sender_id === profile.id ? message.recipient_id : message.sender_id;
        const otherUser = message.sender_id === profile.id ? null : message.sender;

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            id: otherUserId,
            user_id: otherUserId,
            user: otherUser,
            last_message: {
              content: message.message, // Use 'message' column, not 'content'
              sent_at: message.created_at,
              is_read: message.is_read,
              sender_id: message.sender_id,
            },
            unread_count: message.sender_id !== profile.id && !message.is_read ? 1 : 0,
          });
        } else {
          // Update if this is a more recent message
          const existing = conversationsMap.get(otherUserId);
          if (existing && new Date(message.created_at) > new Date(existing.last_message?.sent_at || 0)) {
            existing.last_message = {
              content: message.message,
              sent_at: message.created_at,
              is_read: message.is_read,
              sender_id: message.sender_id,
            };
            if (message.sender_id !== profile.id && !message.is_read) {
              existing.unread_count = (existing.unread_count || 0) + 1;
            }
          }
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${userId}` as any);
  };

  const handleNewMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Create new message screen
    // router.push('/chat/new' as any);
    router.push('/(tabs)/crew'); // Navigate to Crew to select someone to message
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header - ENHANCED */}
        <View style={styles.header}>
          <View>
            <Text variant="h2" weight="black" style={styles.headerTitle}>
              Messages 💬
            </Text>
            <Text variant="caption" color="secondary">
              Chat with your party crew
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={handleNewMessage}
          >
            <LinearGradient
              colors={Gradients.electric}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Card variant="liquid" style={styles.searchCard}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={Colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search messages..."
                placeholderTextColor={Colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </View>

        {/* Conversations List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {isLoading && conversations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : filteredConversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={Gradients.candy}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text variant="h1" style={{ fontSize: 72 }}>💬</Text>
              </View>
              <Text variant="h3" weight="bold" center style={styles.emptyTitle}>
                {searchQuery ? 'No Results' : 'Start Chatting!'}
              </Text>
              <Text variant="body" center color="secondary" style={styles.emptyText}>
                {searchQuery
                  ? `No conversations found for "${searchQuery}"`
                  : 'Connect with your party crew and start the convo! 🎉'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleNewMessage}
                >
                  <LinearGradient
                    colors={Gradients.electric}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyButtonGradient}
                  >
                    <Text variant="h3" style={{ marginRight: Spacing.sm }}>💬</Text>
                    <Text variant="body" weight="bold" color="white">
                      Send First Message
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.conversationsList}>
              {filteredConversations.map((conversation) => {
                const isUnread = conversation.unread_count > 0;
                const isFromMe = conversation.last_message?.sender_id === profile?.id;

                return (
                  <TouchableOpacity
                    key={conversation.id}
                    style={styles.conversationCard}
                    onPress={() => handleConversationPress(conversation.user_id)}
                    activeOpacity={0.7}
                  >
                    <Card variant="liquid">
                      <View style={styles.conversationContent}>
                        {/* Avatar */}
                        <Avatar
                          source={{ uri: conversation.user?.avatar_url }}
                          size="lg"
                          fallbackText={conversation.user?.display_name}
                          online={false}
                        />

                        {/* Conversation Info */}
                        <View style={styles.conversationInfo}>
                          <View style={styles.conversationHeader}>
                            <Text
                              variant="body"
                              weight={isUnread ? 'bold' : 'semibold'}
                              numberOfLines={1}
                              style={styles.conversationName}
                            >
                              {conversation.user?.display_name || 'Unknown User'}
                            </Text>
                            {conversation.last_message && (
                              <Text
                                variant="caption"
                                color={isUnread ? 'primary' : 'tertiary'}
                                style={styles.timestamp}
                              >
                                {formatRelativeTime(conversation.last_message.sent_at)}
                              </Text>
                            )}
                          </View>

                          <View style={styles.messageRow}>
                            <Text
                              variant="caption"
                              color={isUnread ? 'secondary' : 'tertiary'}
                              numberOfLines={1}
                              style={styles.lastMessage}
                            >
                              {isFromMe && (
                                <Text variant="caption" color="tertiary">
                                  You:{' '}
                                </Text>
                              )}
                              {conversation.last_message?.content || 'No messages yet'}
                            </Text>
                            {isUnread && (
                              <View style={styles.unreadBadge}>
                                <Text variant="label" weight="bold" color="white">
                                  {conversation.unread_count}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Chevron */}
                        <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
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
  newMessageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  searchCard: {
    padding: 0,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  loadingContainer: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  conversationsList: {
    gap: Spacing.md,
  },
  conversationCard: {
    marginBottom: Spacing.sm,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  conversationName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  timestamp: {
    fontSize: 11,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
});
