// ============================================
// CREW CARD COMPONENT
// ============================================
// Displays crew information in a card format
// ============================================

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { CrewAvatar } from './CrewAvatar';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import type { Crew } from '@/types/crew';

interface CrewCardProps {
  crew: Crew;
  onPress?: () => void;
}

export function CrewCard({ crew, onPress }: CrewCardProps) {
  const getCrewTypeLabel = (type: string) => {
    switch (type) {
      case 'inner':
        return 'Inner Circle';
      case 'extended':
        return 'Extended';
      case 'open':
        return 'Open';
      default:
        return type;
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return 'lock-closed';
      case 'closed':
        return 'lock-open';
      case 'public':
        return 'globe';
      default:
        return 'people';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <BlurView intensity={20} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          <CrewAvatar
            avatarUrl={crew.avatar_url}
            name={crew.name}
            size={56}
            themeColor={crew.theme_color}
          />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {crew.name}
            </Text>
            {crew.description && (
              <Text style={styles.description} numberOfLines={2}>
                {crew.description}
              </Text>
            )}
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="people"
                  size={14}
                  color={Colors.text.secondary}
                />
                <Text style={styles.metaText}>
                  {crew.member_count} {crew.member_count === 1 ? 'member' : 'members'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name={getPrivacyIcon(crew.privacy_setting) as any}
                  size={14}
                  color={Colors.text.secondary}
                />
                <Text style={styles.metaText}>
                  {getCrewTypeLabel(crew.crew_type)}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.text.secondary}
          />
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  blur: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.md,
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
});
