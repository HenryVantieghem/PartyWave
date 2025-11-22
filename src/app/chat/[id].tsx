import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { formatTime } from '@/lib/utils';

interface Message {
  id: string;
  message: string; // Changed from 'content' to 'message' to match DB schema
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
}

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id && profile?.id) {
      loadChat();
      subscribeToMessages();
    }
  }, [id, profile?.id]);

  const loadChat = async () => {
    if (!id || !profile?.id) return;

    try {
      setIsLoading(true);
      const { supabase } = await import('@/lib/supabase');

      // Fetch other user's profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', id)
        .single();

      if (userError) throw userError;
      setOtherUser(userData);

      // Fetch messages between the two users (DMs only - party_id is null)
      const { data: messagesData, error: messagesError } = await supabase
        .from('party_messages')
        .select('*')
        .is('party_id', null)
        .or(`and(sender_id.eq.${profile.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${profile.id})`)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);

      // Mark messages as read
      await supabase
        .from('party_messages')
        .update({ is_read: true })
        .eq('recipient_id', profile.id)
        .eq('sender_id', id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Load chat error:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!id || !profile?.id) return;

    const setupSubscription = async () => {
      const { supabase } = await import('@/lib/supabase');

      const subscription = supabase
        .channel(`chat:${profile.id}:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'party_messages',
            filter: `and(party_id.is.null,or(and(sender_id.eq.${id},recipient_id.eq.${profile.id}),and(sender_id.eq.${profile.id},recipient_id.eq.${id})))`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => [...prev, newMessage]);

            // Mark as read if not from me
            if (newMessage.sender_id !== profile.id) {
              supabase
                .from('party_messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }

            // Haptic feedback for new message
            if (newMessage.sender_id !== profile.id) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupSubscription();
  };

  const handleSend = async () => {
    if (!messageText.trim() || !id || !profile?.id || isSending) return;

    const tempMessage = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { supabase } = await import('@/lib/supabase');

      const { data, error } = await supabase
        .from('party_messages')
        .insert({
          sender_id: profile.id,
          recipient_id: id,
          message: tempMessage, // Use 'message' column, not 'content'
          party_id: null, // DM, not party-specific
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Send message error:', error);
      setMessageText(tempMessage); // Restore message
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === profile?.id;
    const showTime = true; // You can add logic to group messages

    return (
      <View style={[styles.messageContainer, isMe && styles.messageContainerMe]}>
        {!isMe && (
          <Avatar
            source={{ uri: otherUser?.avatar_url }}
            size="sm"
            fallbackText={otherUser?.display_name}
            style={styles.messageAvatar}
          />
        )}
        <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
          {isMe ? (
            <LinearGradient colors={Gradients.primary} style={styles.messageBubbleGradient}>
              <Text variant="body" color="white" style={styles.messageText}>
                {item.message}
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.messageBubbleOther}>
              <Text variant="body" color="white" style={styles.messageText}>
                {item.message}
              </Text>
            </View>
          )}
          {showTime && (
            <Text
              variant="caption"
              color="tertiary"
              style={isMe ? styles.messageTimeMe : styles.messageTime}
            >
              {formatTime(item.created_at)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerUser} activeOpacity={0.7}>
              <Avatar
                source={{ uri: otherUser?.avatar_url }}
                size="sm"
                fallbackText={otherUser?.display_name}
              />
              <View style={styles.headerUserInfo}>
                <Text variant="body" weight="bold" numberOfLines={1}>
                  {otherUser?.display_name || 'Loading...'}
                </Text>
                <Text variant="caption" color="tertiary" numberOfLines={1}>
                  @{otherUser?.username || '...'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient colors={Gradients.primary} style={styles.emptyIconGradient}>
                <Ionicons name="chatbubble-ellipses" size={48} color={Colors.white} />
              </LinearGradient>
            </View>
            <Text variant="h4" weight="bold" center style={styles.emptyTitle}>
              Start the conversation
            </Text>
            <Text variant="body" center color="secondary" style={styles.emptyText}>
              Send a message to {otherUser?.display_name}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.inputContent}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Message..."
                placeholderTextColor={Colors.text.tertiary}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!messageText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <LinearGradient
                  colors={messageText.trim() ? Gradients.primary : ['#333', '#333']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color={Colors.white} />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.sm,
  },
  headerUserInfo: {
    flex: 1,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    maxWidth: 280,
  },
  messagesList: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  messageContainerMe: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    marginRight: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
  },
  messageBubbleMe: {
    alignItems: 'flex-end',
  },
  messageBubbleGradient: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  messageBubbleOther: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  messageText: {
    lineHeight: 20,
  },
  messageTime: {
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  messageTimeMe: {
    textAlign: 'right',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
    paddingBottom: Platform.OS === 'ios' ? 0 : Spacing.md,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  input: {
    color: Colors.white,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
