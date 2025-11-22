// ============================================
// CREW MEMBER ITEM COMPONENT
// ============================================
// Displays individual crew member with role badge
// ============================================

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Colors, Spacing } from '@/constants/theme';
import type { CrewMember } from '@/types/crew';

interface CrewMemberItemProps {
  member: CrewMember;
  onPress?: () => void;
  showRole?: boolean;
}

export function CrewMemberItem({
  member,
  onPress,
  showRole = true,
}: CrewMemberItemProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: Colors.accent.gold, icon: 'star' };
      case 'admin':
        return { label: 'Admin', color: Colors.accent.purple, icon: 'shield' };
      case 'member':
        return { label: 'Member', color: Colors.text.secondary, icon: 'person' };
      default:
        return { label: role, color: Colors.text.secondary, icon: 'person' };
    }
  };

  const roleBadge = getRoleBadge(member.role);
  const username = member.user?.username || 'Unknown';
  const fullName = member.user?.full_name;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <Avatar
        source={member.user?.avatar_url ? { uri: member.user.avatar_url } : undefined}
        name={username}
        size="md"
      />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          {showRole && (
            <View style={[styles.badge, { backgroundColor: `${roleBadge.color}20` }]}>
              <Ionicons
                name={roleBadge.icon as any}
                size={12}
                color={roleBadge.color}
              />
              <Text style={[styles.badgeText, { color: roleBadge.color }]}>
                {roleBadge.label}
              </Text>
            </View>
          )}
        </View>
        {fullName && (
          <Text style={styles.fullName} numberOfLines={1}>
            {fullName}
          </Text>
        )}
        <Text style={styles.joinedAt}>
          Joined {new Date(member.joined_at).toLocaleDateString()}
        </Text>
      </View>

      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.text.secondary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  fullName: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  joinedAt: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
