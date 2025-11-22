/**
 * VibesOverlay Component
 * Displays selected vibe tags with smooth animations
 * Fixed screen orientation (doesn't rotate with camera)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { VibeTag } from '@/types/party';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VibesOverlayProps {
  vibes: VibeTag[];
  onRemoveVibe?: (vibe: VibeTag) => void;
}

const VIBE_EMOJIS: Record<VibeTag, string> = {
  lit: '🔥',
  chill: '😌',
  wild: '🎉',
  intimate: '💫',
  classy: '🥂',
  casual: '👋',
  rave: '🎵',
  lounge: '🍸',
  party: '🎊',
  dance: '💃',
  gaming: '🎮',
  sports: '⚽',
  networking: '🤝',
  celebration: '🎈',
};

const VIBE_COLORS: Record<VibeTag, string> = {
  lit: Colors.primary,
  chill: Colors.accent.blue,
  wild: Colors.accent.purple,
  intimate: Colors.secondary,
  classy: Colors.accent.gold,
  casual: Colors.accent.green,
  rave: Colors.accent.purple,
  lounge: Colors.accent.blue,
  party: Colors.primary,
  dance: Colors.accent.hotPink,
  gaming: Colors.accent.orange,
  sports: Colors.accent.green,
  networking: Colors.accent.blue,
  celebration: Colors.accent.gold,
};

export function VibesOverlay({ vibes, onRemoveVibe }: VibesOverlayProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Fade in animation
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (vibes.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          <Text variant="caption" weight="semibold" color="secondary" style={styles.label}>
            Vibes
          </Text>
          <View style={styles.vibesContainer}>
            {vibes.map((vibe, index) => (
              <VibeTagBadge
                key={`${vibe}-${index}`}
                vibe={vibe}
                index={index}
                onRemove={onRemoveVibe ? () => onRemoveVibe(vibe) : undefined}
              />
            ))}
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

interface VibeTagBadgeProps {
  vibe: VibeTag;
  index: number;
  onRemove?: () => void;
}

function VibeTagBadge({ vibe, index, onRemove }: VibeTagBadgeProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance using setTimeout
    setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    }, index * 50);

    // Floating animation
    pulse.value = withRepeat(
      withTiming(1.1, { duration: 2000 }),
      -1,
      true
    );

    // Subtle rotation
    rotation.value = withRepeat(
      withTiming(5, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(pulse.value, [1, 1.1], [1, 1.05]);
    return {
      transform: [
        { scale: scale.value * scaleValue },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const color = VIBE_COLORS[vibe] || Colors.primary;
  const emoji = VIBE_EMOJIS[vibe] || '✨';

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text variant="caption" weight="semibold" color="white" style={styles.badgeText}>
          {vibe}
        </Text>
        {onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.dark,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  label: {
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vibesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  badgeText: {
    textTransform: 'capitalize',
  },
  removeButton: {
    marginLeft: Spacing.xs,
  },
});

