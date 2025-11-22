// ============================================
// MEMBER ACTION SHEET COMPONENT
// ============================================
// Bottom sheet with member management actions
// ============================================

import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import type { CrewMember, CrewRole } from '@/types/crew';
import * as Haptics from 'expo-haptics';

interface MemberAction {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
  show: boolean;
}

interface MemberActionSheetProps {
  visible: boolean;
  member: CrewMember | null;
  currentUserRole: CrewRole;
  onClose: () => void;
  onPromoteToAdmin: (memberId: string) => Promise<void>;
  onDemoteToMember: (memberId: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onViewProfile: (userId: string) => void;
}

export function MemberActionSheet({
  visible,
  member,
  currentUserRole,
  onClose,
  onPromoteToAdmin,
  onDemoteToMember,
  onRemoveMember,
  onViewProfile,
}: MemberActionSheetProps) {
  if (!member) return null;

  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin' || isOwner;
  const canManageMembers = isAdmin && member.role !== 'owner';
  const canPromote = canManageMembers && member.role === 'member';
  const canDemote = isOwner && member.role === 'admin';
  const canRemove = canManageMembers;

  const handleAction = async (action: () => Promise<void>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await action();
    onClose();
  };

  const actions: MemberAction[] = [
    {
      label: 'View Profile',
      icon: 'person-outline',
      color: Colors.white,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onViewProfile(member.user_id);
        onClose();
      },
      show: true,
    },
    {
      label: 'Promote to Admin',
      icon: 'shield-outline',
      color: Colors.accent.purple,
      onPress: () => handleAction(() => onPromoteToAdmin(member.id)),
      show: canPromote,
    },
    {
      label: 'Demote to Member',
      icon: 'arrow-down-circle-outline',
      color: Colors.accent.gold,
      onPress: () => handleAction(() => onDemoteToMember(member.id)),
      show: canDemote,
    },
    {
      label: 'Remove from Crew',
      icon: 'remove-circle-outline',
      color: Colors.error,
      onPress: () => handleAction(() => onRemoveMember(member.id)),
      show: canRemove,
    },
  ];

  const visibleActions = actions.filter(action => action.show);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={styles.overlayBlur} />
      </Pressable>

      <View style={styles.container}>
        <BlurView intensity={40} tint="dark" style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>
              {member.user?.username || 'Member'}
            </Text>
            {member.user?.full_name && (
              <Text style={styles.subtitle}>{member.user.full_name}</Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {visibleActions.map((action, index) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.action,
                  index < visibleActions.length - 1 && styles.actionBorder,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
                <Text style={[styles.actionText, { color: action.color }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cancel */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
            ]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBlur: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.xl,
  },
  sheet: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  actions: {
    paddingVertical: Spacing.xs,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  actionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
