// ============================================
// CREW INVITE CARD COMPONENT
// ============================================
// Displays pending crew invite with accept/decline
// ============================================

import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { CrewAvatar } from './CrewAvatar';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import type { CrewInvite } from '@/types/crew';
import * as Haptics from 'expo-haptics';

interface CrewInviteCardProps {
  invite: CrewInvite;
  onAccept: (inviteId: string) => Promise<void>;
  onDecline: (inviteId: string) => Promise<void>;
}

export function CrewInviteCard({
  invite,
  onAccept,
  onDecline,
}: CrewInviteCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAccepting(true);
    try {
      await onAccept(invite.id);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeclining(true);
    try {
      await onDecline(invite.id);
    } finally {
      setDeclining(false);
    }
  };

  const expiresAt = invite.expires_at
    ? new Date(invite.expires_at)
    : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <BlurView intensity={20} tint="dark" style={styles.container}>
      <View style={styles.header}>
        <CrewAvatar
          avatarUrl={invite.crew?.avatar_url}
          name={invite.crew?.name || 'Crew'}
          size={48}
          themeColor={invite.crew?.theme_color}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.crewName} numberOfLines={1}>
            {invite.crew?.name}
          </Text>
          <View style={styles.inviterRow}>
            <Avatar
              source={invite.inviter?.avatar_url ? { uri: invite.inviter.avatar_url } : undefined}
              name={invite.inviter?.username || 'Unknown'}
              size="xs"
            />
            <Text style={styles.inviterText} numberOfLines={1}>
              {invite.inviter?.username} invited you
            </Text>
          </View>
        </View>
      </View>

      {invite.message && (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{invite.message}</Text>
        </View>
      )}

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="people" size={14} color={Colors.text.secondary} />
          <Text style={styles.metaText}>
            {invite.crew?.member_count} members
          </Text>
        </View>
        {daysLeft !== null && daysLeft > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color={Colors.text.secondary} />
            <Text style={styles.metaText}>
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleDecline}
          disabled={accepting || declining}
          style={({ pressed }) => [
            styles.button,
            styles.declineButton,
            pressed && styles.buttonPressed,
          ]}
        >
          {declining ? (
            <ActivityIndicator size="small" color={Colors.text.secondary} />
          ) : (
            <>
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
              <Text style={styles.declineText}>Decline</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleAccept}
          disabled={accepting || declining}
          style={({ pressed }) => [
            styles.button,
            styles.acceptButton,
            pressed && styles.buttonPressed,
          ]}
        >
          {accepting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.acceptText}>Accept</Text>
            </>
          )}
        </Pressable>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  inviterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inviterText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  declineText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
