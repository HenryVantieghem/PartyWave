// ============================================
// CREW AVATAR COMPONENT
// ============================================
// Displays crew avatar with initials fallback
// ============================================

import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface CrewAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: number;
  themeColor?: string;
}

export function CrewAvatar({
  avatarUrl,
  name,
  size = 48,
  themeColor = Colors.accent.purple,
}: CrewAvatarProps) {
  // Generate initials from crew name (first 2 letters of first 2 words)
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.image} />
      ) : (
        <View
          style={[
            styles.placeholder,
            { backgroundColor: themeColor || Colors.accent.purple },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
});
